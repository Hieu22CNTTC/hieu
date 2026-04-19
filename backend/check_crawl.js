import prisma from './config/database.js';
async function run() {
  try {
    const c = await prisma.flight.count({
      where: { notes: { contains: 'Auto-imported by HTML crawler job' } }
    });
    const rows = await prisma.flight.findMany({
      where: { notes: { contains: 'Auto-imported by HTML crawler job' } },
      take: 5,
      orderBy: { updatedAt: 'desc' },
      select: { flightNumber: true, departureTime: true, basePrice: true, updatedAt: true }
    });
    console.log(JSON.stringify({ count: c, rows }, null, 2));
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}
run();
