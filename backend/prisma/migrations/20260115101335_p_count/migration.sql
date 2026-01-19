/*
  Warnings:

  - Added the required column `participantCount` to the `Room` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Room" ADD COLUMN     "participantCount" INTEGER NOT NULL;
