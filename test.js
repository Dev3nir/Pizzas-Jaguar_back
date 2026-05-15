
//generar un hash de contraseña

const bcrypt = require('bcrypt');
const password = "Pizza1234";
const saltRounds = 10;
bcrypt.hash(password, saltRounds, function(err, hash) {
    if (err) {
        console.error('Error al generar el hash:', err);
    } else {
        console.log('Hash generado:', hash);
    }
});
//$2b$10$njdUKTH8eVkEzc0Y3.PVUeYxQT9uDopVICF0ZyctKq92.kD6MpNj6

//admin1
//Pizza1234