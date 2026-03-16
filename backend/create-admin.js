require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// ============================================
// CONFIGURA ESTOS DATOS ANTES DE EJECUTAR
// ============================================
const NEW_ADMIN = {
  name: 'Admin',
  email: 'ttechashu@gmail.com',   // <-- cambia esto
  password: 'Ashustore2!',   // <-- cambia esto
};

const DELETE_OLD_ADMIN = true; // false si NO quieres borrar el antiguo
// ============================================

async function main() {
  try {
    console.log('🔌 Conectando a MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado a MongoDB');

    const User = require('./models/User'); // ajusta la ruta si es necesario

    // 1. Ver admins existentes
    const existingAdmins = await User.find({ role: 'admin' }).select('name email _id');
    if (existingAdmins.length > 0) {
      console.log('\n📋 Admins actuales:');
      existingAdmins.forEach(a => console.log(`  - ${a.name} (${a.email}) [${a._id}]`));
    } else {
      console.log('\n📋 No hay ningún admin actualmente');
    }

    // 2. Comprobar si el nuevo email ya existe
    const existing = await User.findOne({ email: NEW_ADMIN.email });
    if (existing) {
      console.log(`\n⚠️  El email ${NEW_ADMIN.email} ya existe. Actualizando a admin...`);
      existing.role = 'admin';
      existing.active = true;
      existing.emailVerified = true;
      await existing.save();
      console.log(`✅ Usuario existente actualizado a admin: ${existing.name}`);
    } else {
      // 3. Crear nuevo admin
      const hashedPassword = await bcrypt.hash(NEW_ADMIN.password, 10);
      const newAdmin = new User({
        name: NEW_ADMIN.name,
        email: NEW_ADMIN.email,
        password: hashedPassword,
        role: 'admin',
        active: true,
        emailVerified: true,
      });
      await newAdmin.save();
      console.log(`\n✅ Nuevo admin creado: ${newAdmin.name} (${newAdmin.email}) [${newAdmin._id}]`);
    }

    // 4. Eliminar admins antiguos (todos excepto el nuevo)
    if (DELETE_OLD_ADMIN && existingAdmins.length > 0) {
      for (const oldAdmin of existingAdmins) {
        if (oldAdmin.email !== NEW_ADMIN.email) {
          await User.deleteOne({ _id: oldAdmin._id });
          console.log(`🗑️  Admin eliminado: ${oldAdmin.name} (${oldAdmin.email})`);
        }
      }
    }

    console.log('\n🎉 Listo. Credenciales del nuevo admin:');
    console.log(`   Email:      ${NEW_ADMIN.email}`);
    console.log(`   Contraseña: ${NEW_ADMIN.password}`);
    console.log('\n⚠️  Cambia la contraseña tras el primer login.\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Desconectado de MongoDB');
    process.exit(0);
  }
}

main();
