require('dotenv').config();
const { sequelize, User, Base, EquipmentType } = require('../models');

async function seed() {
  await sequelize.sync();

  const [north, south] = await Promise.all([
    Base.findOrCreate({ where: { code: 'NORTH-04' }, defaults: { name: 'Northern Command Base', code: 'NORTH-04', location: 'Sector 4' } }),
    Base.findOrCreate({ where: { code: 'SOUTH-11' }, defaults: { name: 'Southern Garrison', code: 'SOUTH-11', location: 'Sector 11' } }),
  ]);

  const equipmentSeeds = [
    { name: '5.56mm Rifle', category: 'weapon', unit: 'unit', is_serialized: true },
    { name: '5.56mm Ammunition', category: 'ammunition', unit: 'rounds', is_serialized: false },
    { name: 'Light Tactical Vehicle', category: 'vehicle', unit: 'unit', is_serialized: true },
  ];
  for (const eq of equipmentSeeds) {
    await EquipmentType.findOrCreate({ where: { name: eq.name }, defaults: eq });
  }

  const userSeeds = [
    { name: 'Aja Admin', email: 'admin@mams.local', password_hash: 'ChangeMe123!', role: 'admin', base_id: null },
    { name: 'Cmdr. North', email: 'commander.north@mams.local', password_hash: 'ChangeMe123!', role: 'base_commander', base_id: north[0].id },
    { name: 'Logistics South', email: 'logistics.south@mams.local', password_hash: 'ChangeMe123!', role: 'logistics_officer', base_id: south[0].id },
  ];
  for (const u of userSeeds) {
    await User.findOrCreate({ where: { email: u.email }, defaults: u });
  }

  console.log('Seed complete. Demo login: admin@mams.local / ChangeMe123!');
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
