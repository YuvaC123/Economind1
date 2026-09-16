/*
  Warnings:

  - You are about to drop the `scenarios` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "scenarios" DROP CONSTRAINT "scenarios_user_id_fkey";

-- AlterTable
ALTER TABLE "Persona" ADD COLUMN     "education" TEXT,
ADD COLUMN     "gender" TEXT,
ADD COLUMN     "investment_preference" TEXT,
ADD COLUMN     "saving_preference" TEXT,
ADD COLUMN     "spending_behavior" TEXT;

-- DropTable
DROP TABLE "scenarios";

-- CreateTable
CREATE TABLE "Scenario" (
    "id" TEXT NOT NULL,
    "scenario_name" TEXT NOT NULL,
    "inflation_rate" DOUBLE PRECISION NOT NULL,
    "interest_rate" DOUBLE PRECISION NOT NULL,
    "unemployment_rate" DOUBLE PRECISION NOT NULL,
    "market_volatility" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "user_id" TEXT NOT NULL,

    CONSTRAINT "Scenario_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Scenario" ADD CONSTRAINT "Scenario_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
