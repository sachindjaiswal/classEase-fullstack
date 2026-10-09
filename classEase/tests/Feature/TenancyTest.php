<?php

use App\Models\classes;
use App\Models\Subject;
use App\Models\Teacher;
use App\Models\Tenant;
use App\Models\User;
use App\Tenant\TenantContext;
use Laravel\Sanctum\Sanctum;

function tenancyForeignTenant(): Tenant
{
    return Tenant::query()->firstOrCreate(
        ['slug' => 'other-school'],
        ['name' => 'Other School'],
    );
}

function tenancyUserFor(string $role, Tenant $tenant): User
{
    $previous = TenantContext::id();
    TenantContext::set((int) $tenant->id);

    $user = User::factory()->create(['role' => $role]);

    TenantContext::set($previous);

    return $user;
}

function tenancyNullTenantUser(string $role): User
{
    $previous = TenantContext::id();
    TenantContext::set(null);

    $user = User::factory()->create(['role' => $role, 'tenant_id' => null]);

    TenantContext::set($previous);

    return $user;
}

function tenancyTeacherFor(Tenant $tenant): Teacher
{
    $previous = TenantContext::id();
    TenantContext::set((int) $tenant->id);

    $user = User::factory()->create(['role' => 'teacher']);
    $teacher = Teacher::create([
        'user_id' => $user->id,
        'email' => $user->email,
        'first_name' => 'Tina',
        'middle_name' => '',
        'surname' => 'Tenure',
        'contact' => '9876543210',
        'designation' => 'Mathematics',
        'monthly_salary' => 30000,
    ]);

    TenantContext::set($previous);

    return $teacher;
}

function tenancyForeignClass(): classes
{
    $previous = TenantContext::id();
    TenantContext::set((int) tenancyForeignTenant()->id);

    $class = classes::create(['class_name' => 'Foreign Class', 'section' => 'B', 'room_no' => '202']);

    TenantContext::set($previous);

    return $class;
}

test('class list only contains classes of the caller tenant', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $own = classes::create(['class_name' => 'Own Class', 'section' => 'A', 'room_no' => '101']);
    $foreign = tenancyForeignClass();

    Sanctum::actingAs($admin);

    $ids = collect($this->getJson('/api/classes')->assertOk()->json('classes'))->pluck('id');

    expect($ids)->toContain($own->id)
        ->not->toContain($foreign->id);
});

test('reading another tenant class returns 404', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $foreign = tenancyForeignClass();

    Sanctum::actingAs($admin);

    $this->getJson("/api/classes/{$foreign->id}")->assertNotFound();
});

test('updating or deleting another tenant class returns 404', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $foreign = tenancyForeignClass();

    Sanctum::actingAs($admin);

    $this->putJson("/api/classes/{$foreign->id}", [
        'class_name' => 'Hijacked',
        'section' => 'X',
        'room_no' => '999',
    ])->assertNotFound();

    $this->deleteJson("/api/classes/{$foreign->id}")->assertNotFound();

    expect($foreign->fresh()->class_name)->toBe('Foreign Class');
});

test('writes cannot reference rows of another tenant', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $ownClass = classes::create(['class_name' => 'Own Class', 'section' => 'A', 'room_no' => '101']);
    $ownTeacher = tenancyTeacherFor(Tenant::query()->where('slug', 'test-school')->firstOrFail());
    $foreignTeacher = tenancyTeacherFor(tenancyForeignTenant());
    $foreignClass = tenancyForeignClass();

    Sanctum::actingAs($admin);

    $this->postJson('/api/subjects', [
        'classId' => $foreignClass->id,
        'subjectName' => 'Smuggled Subject',
        'teacherId' => $ownTeacher->id,
    ])->assertUnprocessable()
        ->assertJsonValidationErrors(['classId']);

    $this->postJson('/api/subjects', [
        'classId' => $ownClass->id,
        'subjectName' => 'Foreign Teacher Subject',
        'teacherId' => $foreignTeacher->id,
    ])->assertUnprocessable()
        ->assertJsonValidationErrors(['teacherId']);

    $this->postJson('/api/classes', [
        'class_teacher' => $foreignTeacher->id,
        'class_name' => 'Linked Class',
        'section' => 'C',
        'room_no' => '303',
    ])->assertUnprocessable()
        ->assertJsonValidationErrors(['class_teacher']);

    expect(Subject::where('subjectName', 'Smuggled Subject')->exists())->toBeFalse();
});

test('rows created through the api are stamped with the caller tenant', function () {
    $admin = User::factory()->create(['role' => 'admin']);

    Sanctum::actingAs($admin);

    $id = $this->postJson('/api/classes', [
        'class_name' => 'Stamped Class',
        'section' => 'A',
        'room_no' => '111',
    ])->assertCreated()->json('class.id');

    $created = classes::find($id);

    expect($created)->not->toBeNull()
        ->and((int) $created->tenant_id)->toBe((int) $admin->tenant_id);
});

test('a user with no institution is rejected with 403', function () {
    $user = tenancyNullTenantUser('student');

    Sanctum::actingAs($user);

    $this->getJson('/api/me')->assertForbidden()
        ->assertJsonPath('message', 'Your account is not linked to an institution.');
});

test('a user whose institution is soft deleted is rejected with 403', function () {
    $tenant = Tenant::query()->create(['name' => 'Doomed School', 'slug' => 'doomed-school']);
    $user = tenancyUserFor('admin', $tenant);

    $tenant->delete();

    Sanctum::actingAs($user);

    $this->getJson('/api/me')->assertForbidden()
        ->assertJsonPath('message', 'Your institution has been deactivated.');
});

test('platform admin can list and create institutions with their first admin', function () {
    $platform = tenancyNullTenantUser('platform_admin');

    Sanctum::actingAs($platform);

    $this->getJson('/api/platform/tenants')->assertOk();

    $tenantId = $this->postJson('/api/platform/tenants', [
        'name' => 'New School',
        'slug' => 'new-school',
        'admin_name' => 'New Admin',
        'admin_email' => 'newadmin@newschool.com',
        'admin_password' => 'secret123',
    ])->assertCreated()->json('tenant.id');

    $tenant = Tenant::find($tenantId);
    expect($tenant)->not->toBeNull();

    $admin = User::where('email', 'newadmin@newschool.com')->first();
    expect($admin)->not->toBeNull()
        ->and($admin->role)->toBe('admin')
        ->and((int) $admin->tenant_id)->toBe((int) $tenantId);
});

test('platform admin sees every institution', function () {
    tenancyForeignTenant();
    $platform = tenancyNullTenantUser('platform_admin');

    Sanctum::actingAs($platform);

    $slugs = collect($this->getJson('/api/platform/tenants')->assertOk()->json('tenants'))->pluck('slug');

    expect($slugs)->toContain('test-school', 'other-school');
});

test('anyone can fetch the list of institutions for sign-up', function () {
    tenancyForeignTenant();

    $slugs = collect($this->getJson('/api/tenants')->assertOk()->json('tenants'))
        ->pluck('slug');

    expect($slugs)->toContain('test-school', 'other-school');
});

test('soft-deleted institutions are hidden from the sign-up list', function () {
    $tenant = tenancyForeignTenant();
    $tenant->delete();

    $slugs = collect($this->getJson('/api/tenants')->assertOk()->json('tenants'))
        ->pluck('slug');

    expect($slugs)->toContain('test-school')
        ->not->toContain('other-school');
});

test('platform admin can add a second admin to an institution', function () {
    $platform = tenancyNullTenantUser('platform_admin');
    $tenant = Tenant::query()->where('slug', 'test-school')->firstOrFail();

    Sanctum::actingAs($platform);

    $adminId = $this->postJson("/api/platform/tenants/{$tenant->id}/admins", [
        'name' => 'Second Admin',
        'email' => 'second@school.com',
        'password' => 'secret123',
    ])->assertCreated()->json('admin.id');

    $admin = User::find($adminId);
    expect($admin)->not->toBeNull()
        ->and($admin->role)->toBe('admin')
        ->and((int) $admin->tenant_id)->toBe((int) $tenant->id);
});

test('adding a tenant admin with an in-use email is rejected', function () {
    $platform = tenancyNullTenantUser('platform_admin');
    $tenant = Tenant::query()->where('slug', 'test-school')->firstOrFail();

    Sanctum::actingAs($platform);

    $this->postJson("/api/platform/tenants/{$tenant->id}/admins", [
        'name' => 'Collision Admin',
        'email' => $platform->email,
        'password' => 'secret123',
    ])->assertUnprocessable()
        ->assertJsonValidationErrors(['email']);
});

test('a tenant admin cannot access platform routes', function () {
    $admin = User::factory()->create(['role' => 'admin']);

    Sanctum::actingAs($admin);

    $this->getJson('/api/platform/tenants')->assertForbidden();
    $this->postJson('/api/platform/tenants', [
        'name' => 'Sneaky School',
        'slug' => 'sneaky-school',
        'admin_name' => 'Sneaky Admin',
        'admin_email' => 'sneaky@school.com',
        'admin_password' => 'secret123',
    ])->assertForbidden();

    expect(Tenant::where('slug', 'sneaky-school')->exists())->toBeFalse();
});

test('platform admin can delete an institution admin and revoke their sessions', function () {
    $platform = tenancyNullTenantUser('platform_admin');
    $tenant = Tenant::query()->where('slug', 'test-school')->firstOrFail();
    tenancyUserFor('admin', $tenant);
    $target = tenancyUserFor('admin', $tenant);
    $target->createToken('session-a');
    $target->createToken('session-b');

    Sanctum::actingAs($platform);

    $this->deleteJson("/api/platform/users/{$target->id}")->assertOk();

    expect($target->fresh()->trashed())->toBeTrue()
        ->and($target->tokens()->count())->toBe(0);
});

test('platform admin cannot delete their own account or another platform admin', function () {
    $platform = tenancyNullTenantUser('platform_admin');
    $peer = tenancyNullTenantUser('platform_admin');

    Sanctum::actingAs($platform);

    $this->deleteJson("/api/platform/users/{$platform->id}")->assertStatus(422);
    $this->deleteJson("/api/platform/users/{$peer->id}")->assertStatus(422);

    expect($peer->fresh()->trashed())->toBeFalse();
});

test('the last admin of an institution cannot be deleted', function () {
    $platform = tenancyNullTenantUser('platform_admin');
    $tenant = Tenant::query()->create(['name' => 'Solo School', 'slug' => 'solo-school']);
    $solo = tenancyUserFor('admin', $tenant);

    Sanctum::actingAs($platform);

    $this->deleteJson("/api/platform/users/{$solo->id}")->assertStatus(422);

    expect($solo->fresh()->trashed())->toBeFalse();
});

test('a tenant admin cannot delete users via the platform endpoint', function () {
    $admin = tenancyUserFor('admin', Tenant::query()->where('slug', 'test-school')->firstOrFail());
    $target = User::factory()->create(['role' => 'student']);

    Sanctum::actingAs($admin);

    $this->deleteJson("/api/platform/users/{$target->id}")->assertForbidden();

    expect($target->fresh()->trashed())->toBeFalse();
});
