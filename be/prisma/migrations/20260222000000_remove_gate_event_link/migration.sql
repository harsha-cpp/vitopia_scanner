-- DropForeignKey
ALTER TABLE "gates" DROP CONSTRAINT IF EXISTS "gates_event_id_fkey";

-- DropIndex
DROP INDEX IF EXISTS "gates_event_id_idx";

-- AlterTable
ALTER TABLE "gates" DROP COLUMN IF EXISTS "event_id";
