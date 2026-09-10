interface Teacher {
    id: number;
    name: string;
    email: string;
    contact: string;
    designation: string;
}

interface Class {
    id: number;
    class_name: string;
    section: string;
    room_no: string;
    class_teacher: Teacher;
}

interface Props {
    classes: Class[];
}
export default function GetClasses({ classes }: Props) {
    return (
        <div>
            <h1>Classes</h1>

            {classes.map((classItem) => (
                <div key={classItem.id}>
                    <h2>
                        {classItem.class_name} - {classItem.section}
                    </h2>

                    <p>Room: {classItem.room_no}</p>

                    <h3>Class Teacher</h3>

                    <p>Name: {classItem.class_teacher.name}</p>
                    <p>Email: {classItem.class_teacher.email}</p>
                    <p>Contact: {classItem.class_teacher.contact}</p>
                    <p>Designation: {classItem.class_teacher.designation}</p>
                </div>
            ))}
        </div>
    );
}
