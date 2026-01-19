const mongoose = require('mongoose');

async function cleanupDuplicateBoards() {
  try {
    await mongoose.connect('mongodb://localhost:27017/pm-tool2');

    const KanbanBoard = mongoose.model(
      'KanbanBoard',
      new mongoose.Schema({
        workspaceId: mongoose.Schema.Types.ObjectId,
        name: String,
        description: String,
      }),
    );

    // Find all workspaces that have multiple "Default Board" entries
    const duplicateBoards = await KanbanBoard.aggregate([
      {
        $match: { name: 'Default Board' },
      },
      {
        $group: {
          _id: '$workspaceId',
          boards: { $push: '$_id' },
          count: { $sum: 1 },
        },
      },
      {
        $match: { count: { $gt: 1 } },
      },
    ]);

    console.log(`Found ${duplicateBoards.length} workspaces with duplicate Default Boards`);

    for (const workspace of duplicateBoards) {
      const boards = workspace.boards;
      // Keep the first board, delete the rest
      const boardsToDelete = boards.slice(1);

      console.log(
        `Workspace ${workspace._id}: keeping ${boards[0]}, deleting ${boardsToDelete.join(', ')}`,
      );

      await KanbanBoard.deleteMany({
        _id: { $in: boardsToDelete },
      });
    }

    console.log('Cleanup completed');
  } catch (error) {
    console.error('Error during cleanup:', error);
  } finally {
    await mongoose.disconnect();
  }
}

cleanupDuplicateBoards();
