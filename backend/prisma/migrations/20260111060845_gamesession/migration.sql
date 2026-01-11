/*
  Warnings:

  - You are about to drop the column `roomId` on the `GameSession` table. All the data in the column will be lost.
  - You are about to drop the column `roundNumber` on the `GameSession` table. All the data in the column will be lost.
  - You are about to drop the column `playerClicks` on the `MatchHistory` table. All the data in the column will be lost.
  - Added the required column `gridSize` to the `GameSession` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "GameSession" DROP CONSTRAINT "GameSession_roomId_fkey";

-- AlterTable
ALTER TABLE "GameSession" DROP COLUMN "roomId",
DROP COLUMN "roundNumber",
ADD COLUMN     "gridSize" INTEGER NOT NULL,
ADD COLUMN     "turnOrder" TEXT[],
ADD COLUMN     "winnerId" TEXT;

-- AlterTable
ALTER TABLE "MatchHistory" DROP COLUMN "playerClicks",
ADD COLUMN     "linesCount" INTEGER NOT NULL DEFAULT 0;
