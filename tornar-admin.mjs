import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from './src/generated/prisma/client.js'
import { config } from 'dotenv'

config({ path: '.env.local' })

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

const result = await prisma.user.updateMany({ data: { role: 'ADMIN' } })
console.log('Pronto! Usuários atualizados:', result.count)
await prisma.$disconnect()
