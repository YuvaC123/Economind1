/*
  Warnings:

  - You are about to drop the `Scenario` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Scenario" DROP CONSTRAINT "Scenario_user_id_fkey";

-- DropTable
DROP TABLE "Scenario";

-- CreateTable
CREATE TABLE "scenarios" (
    "id" TEXT NOT NULL,
    "scenario_name" TEXT NOT NULL,
    "inflation_rate" DOUBLE PRECISION NOT NULL,
    "interest_rate" DOUBLE PRECISION NOT NULL,
    "unemployment_rate" DOUBLE PRECISION NOT NULL,
    "market_volitality" DOUBLE PRECISION NOT NULL,
    "user_id" TEXT NOT NULL,

    CONSTRAINT "scenarios_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "scenarios" ADD CONSTRAINT "scenarios_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
