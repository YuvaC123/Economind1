-- CreateTable
CREATE TABLE "Simulation" (
    "id" TEXT NOT NULL,
    "persona_name" TEXT NOT NULL,
    "scenario_name" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "decisions" JSONB NOT NULL,
    "confidence" JSONB NOT NULL,
    "behavioral_traits" JSONB NOT NULL,
    "theory_alignment" JSONB NOT NULL,
    "reasoning" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "user_id" TEXT NOT NULL,

    CONSTRAINT "Simulation_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Simulation" ADD CONSTRAINT "Simulation_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
