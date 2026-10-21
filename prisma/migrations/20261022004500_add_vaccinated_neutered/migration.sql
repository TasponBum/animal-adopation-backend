-- AlterTable
ALTER TABLE "Pet" ADD COLUMN     "neutered" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "vaccinated" BOOLEAN NOT NULL DEFAULT false;

