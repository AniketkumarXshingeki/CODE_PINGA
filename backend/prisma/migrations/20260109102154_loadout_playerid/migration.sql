-- DropForeignKey
ALTER TABLE "Loadout" DROP CONSTRAINT "Loadout_userId_fkey";

-- AddForeignKey
ALTER TABLE "Loadout" ADD CONSTRAINT "Loadout_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("playerId") ON DELETE RESTRICT ON UPDATE CASCADE;
