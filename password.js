const bcrypt = require('bcryptjs');
const fs = require('fs');

const usersFilePath = './data/users.json';
const usersData = JSON.parse(fs.readFileSync(usersFilePath, 'utf-8'));

(async () => {
  for (const user of usersData) {
    if (user.password && !user.password.startsWith('$2a$')) {
      user.password = await bcrypt.hash(user.password, 10);
    }
  }
  fs.writeFileSync(usersFilePath, JSON.stringify(usersData, null, 2));
  console.log('Senhas hashadas e arquivo JSON atualizado.');
})();