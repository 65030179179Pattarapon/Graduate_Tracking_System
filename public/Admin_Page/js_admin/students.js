// public/Admin_Page/js_admin/students.js

document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');

    if (!token || role !== 'admin') {
        alert('คุณไม่มีสิทธิ์เข้าถึงหน้านี้');
        window.location.href = '/login/index.html';
        return;
    }

    fetchStudents(token);
});

async function fetchStudents(token) {
    try {
        const response = await fetch('/api/admin/students', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const result = await response.json();

        if (result.success) {
            renderStudentTable(result.data);
        } else {
            alert(`เกิดข้อผิดพลาด: ${result.message}`);
            // ถ้า Token ไม่ถูก อาจจะส่งกลับไปหน้า Login
            if (response.status === 401 || response.status === 403) {
                 window.location.href = '/login/index.html';
            }
        }
    } catch (error) {
        console.error('Failed to fetch students:', error);
        alert('ไม่สามารถเชื่อมต่อเพื่อดึงข้อมูลนักศึกษาได้');
    }
}

function renderStudentTable(students) {
    const tableBody = document.getElementById('student-table-body');
    if (!tableBody) return;

    tableBody.innerHTML = ''; // เคลียร์ข้อมูลเก่า

    if (students.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="5" style="text-align:center;">ไม่พบข้อมูลนักศึกษา</td></tr>';
        return;
    }

    students.forEach(student => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${student.student_id}</td>
            <td>${student.prefix_th} ${student.first_name_th} ${student.last_name_th}</td>
            <td>${student.email || '-'}</td>
            <td>${student.phone || '-'}</td>            
            <td>${student.program_name || '-'}</td>  
        `;
         // <td>อาจารย์ที่ปรึกษาวิทยานิพนธ์</td> เรายังไม่มีข้อมูลส่วนนี้ จะใส่ - ไปก่อน
        // ทำให้ทั้งแถวสามารถคลิกเพื่อไปหน้าแก้ไขได้ (เราจะทำในขั้นตอนถัดไป)
        row.style.cursor = 'pointer';
        row.addEventListener('click', () => {
            window.location.href = `manage_students.html?id=${student.student_id}`;
        });

        tableBody.appendChild(row);
    });
}