/*
  Warnings:

  - You are about to drop the column `harness` on the `submission` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "problem" ADD COLUMN     "harness" TEXT;

-- AlterTable
ALTER TABLE "submission" DROP COLUMN "harness";
