<?php
session_start();

// 🔌 DATABASE CONNECTION
$conn = new mysqli("localhost","root","","entry_management_system");

if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}
?>

<!DOCTYPE html>
<html>
<head>
    <title>Admin Login Result</title>

    <style>
        table {
            border-collapse: collapse;
            width: 50%;
            margin: 50px auto;
            text-align: center;
        }

        table, th, td {
            border: 1px solid black;
            padding: 10px;
        }

        th {
            background: #3498db;
            color: white;
        }
    </style>

</head>
<body>

<?php
// 🔐 LOGIN LOGIC
if(isset($_POST['login'])){
    $user = $_POST['username'];
    $pass = $_POST['password'];

    $sql = "SELECT * FROM admin_info 
            WHERE username='$user' AND password='$pass'";

    $result = $conn->query($sql);

    if($result->num_rows > 0){

        echo "<h2 style='text-align:center;'>Login Successful!</h2>";

        // ✅ TABLE START
        echo "<table>";
        echo "<tr>
                <th>ID</th>
                <th>Username</th>
                <th>Password</th>
              </tr>";

        while($row = $result->fetch_assoc()){
            echo "<tr>
                    <td>".$row['id']."</td>
                    <td>".$row['username']."</td>
                    <td>".$row['password']."</td>
                  </tr>";
        }

        echo "</table>";

    } else {

        // ❌ popup
        echo "<script>
                alert('Invalid Username or Password!');
                window.history.back();
              </script>";
    }
}

$conn->close();
?>

</body>
</html>