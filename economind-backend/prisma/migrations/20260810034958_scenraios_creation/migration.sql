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
