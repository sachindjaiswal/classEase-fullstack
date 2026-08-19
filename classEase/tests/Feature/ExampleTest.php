<?php

test('login requires credentials', function () {
    $this->postJson('/api/login')
        ->assertStatus(422)
        ->assertJsonValidationErrors(['email', 'password']);
});

test('health check responds', function () {
    $this->get('/up')->assertOk();
});
