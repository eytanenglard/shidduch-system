-- AlterTable
ALTER TABLE "_ApprovedSuggestions" ADD CONSTRAINT "_ApprovedSuggestions_AB_pkey" PRIMARY KEY ("A", "B");

-- DropIndex
DROP INDEX "_ApprovedSuggestions_AB_unique";

-- AlterTable
ALTER TABLE "_ReviewedSuggestions" ADD CONSTRAINT "_ReviewedSuggestions_AB_pkey" PRIMARY KEY ("A", "B");

-- DropIndex
DROP INDEX "_ReviewedSuggestions_AB_unique";
