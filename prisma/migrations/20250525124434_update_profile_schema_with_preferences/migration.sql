-- AlterTable
ALTER TABLE "Profile" ADD COLUMN     "preferredAliyaStatus" TEXT,
ADD COLUMN     "preferredCharacterTraits" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "preferredHeadCoverings" "HeadCoveringType"[] DEFAULT ARRAY[]::"HeadCoveringType"[],
ADD COLUMN     "preferredHobbies" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "preferredKippahTypes" "KippahType"[] DEFAULT ARRAY[]::"KippahType"[],
ADD COLUMN     "preferredMaritalStatuses" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "preferredOrigins" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "preferredPartnerHasChildren" TEXT,
ADD COLUMN     "preferredServiceTypes" "ServiceType"[] DEFAULT ARRAY[]::"ServiceType"[],
ADD COLUMN     "preferredShomerNegiah" TEXT,
ADD COLUMN     "preferred_has_children_from_previous" BOOLEAN;
