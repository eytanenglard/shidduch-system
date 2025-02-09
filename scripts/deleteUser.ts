import { PrismaClient, Gender } from '@prisma/client'

const prisma = new PrismaClient()

async function deleteUserWithRelations(email: string) {
  try {
    // Check if user exists with all relations
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        profile: true,
        verifications: true,
        statusHistory: true,
        sentInvitations: true,
        receivedInvitation: true,
        receivedMatches: true,
        suggestedMatches: true,
        matchPreferences: true,
        firstPartySuggestions: true,
        createdSuggestions: true,
        secondPartySuggestions: true,
        matchmakerProfile: true,
        questionnaire: true,
        videos: true,
      }
    });

    if (!user) {
      console.log(`User with email ${email} not found`);
      return;
    }

    console.log(`Found user with ID: ${user.id}`);

    await prisma.$transaction(async (tx) => {
      // 1. Delete all verifications
      if (user.verifications.length > 0) {
        await tx.verification.deleteMany({
          where: { userId: user.id }
        });
        console.log('Deleted verifications');
      }

      // 2. Delete status history
      if (user.statusHistory.length > 0) {
        await tx.userStatusHistory.deleteMany({
          where: { userId: user.id }
        });
        console.log('Deleted status history');
      }

      // 3. Delete videos
      if (user.videos.length > 0) {
        await tx.video.deleteMany({
          where: { userId: user.id }
        });
        console.log('Deleted videos');
      }

      // 4. Delete match suggestion communications
      await tx.matchSuggestionCommunication.deleteMany({
        where: {
          suggestion: {
            OR: [
              { firstPartyId: user.id },
              { secondPartyId: user.id },
              { matchmakerId: user.id }
            ]
          }
        }
      });
      console.log('Deleted match suggestion communications');

      // 5. Delete match suggestions
      if (user.firstPartySuggestions.length > 0 || 
          user.createdSuggestions.length > 0 || 
          user.secondPartySuggestions.length > 0) {
        await tx.matchSuggestion.deleteMany({
          where: {
            OR: [
              { firstPartyId: user.id },
              { secondPartyId: user.id },
              { matchmakerId: user.id }
            ]
          }
        });
        console.log('Deleted match suggestions');
      }

      // 6. Delete meetings
      await tx.meeting.deleteMany({
        where: {
          match: {
            OR: [
              { candidateId: user.id },
              { matchmakerId: user.id }
            ]
          }
        }
      });
      console.log('Deleted meetings');

      // 7. Delete matches
      if (user.receivedMatches.length > 0 || user.suggestedMatches.length > 0) {
        await tx.match.deleteMany({
          where: {
            OR: [
              { candidateId: user.id },
              { matchmakerId: user.id }
            ]
          }
        });
        console.log('Deleted matches');
      }

      // 8. Delete invitations
      if (user.sentInvitations.length > 0 || user.receivedInvitation) {
        await tx.invitation.deleteMany({
          where: {
            OR: [
              { userId: user.id },
              { matchmakerId: user.id }
            ]
          }
        });
        console.log('Deleted invitations');
      }

      // 9. Delete match preferences
      if (user.matchPreferences) {
        await tx.matchPreferences.delete({
          where: { userId: user.id }
        });
        console.log('Deleted match preferences');
      }

      // 10. Delete questionnaire
      if (user.questionnaire) {
        await tx.personalQuestionnaire.delete({
          where: { userId: user.id }
        });
        console.log('Deleted questionnaire');
      }

      // 11. Delete matchmaker profile
      if (user.matchmakerProfile) {
        await tx.matchmakerProfile.delete({
          where: { userId: user.id }
        });
        console.log('Deleted matchmaker profile');
      }

      // 12. Delete profile
      if (user.profile) {
        await tx.profile.delete({
          where: { userId: user.id }
        });
        console.log('Deleted profile');
      }

      // 13. Finally, delete the user
      await tx.user.delete({
        where: { id: user.id }
      });
      console.log('Deleted user');
    });

    console.log(`Successfully deleted user ${email} and all related records`);

  } catch (error) {
    console.error('Error deleting user:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
deleteUserWithRelations('eytanenglard2@gmail.com')
  .then(() => {
    console.log('Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  });