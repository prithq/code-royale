/*
  Warnings:

  - Made the column `harness` on table `problem` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "problem" ALTER COLUMN "harness" SET NOT NULL;
