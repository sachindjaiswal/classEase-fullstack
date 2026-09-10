<h2>Add Student</h2>

<form action="/students" method="POST">
    @csrf

    <input type="number" name="classId" placeholder="Class ID"><br><br>

    <input type="text" name="firstName" placeholder="First Name"><br><br>

    <input type="text" name="middleName" placeholder="Middle Name"><br><br>

    <input type="text" name="surname" placeholder="Surname"><br><br>

    <input type="email" name="email" placeholder="Email"><br><br>

    <input type="password" name="password" placeholder="Password"><br><br>

    <input type="text" name="contact" placeholder="Contact"><br><br>

    <input type="text" name="parentContact" placeholder="Parent Contact"><br><br>

    <input type="text" name="address" placeholder="Address"><br><br>

    <button type="submit">Add Student</button>
</form>