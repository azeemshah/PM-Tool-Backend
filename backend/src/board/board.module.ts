import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BoardController } from './board.controller';
import { BoardService } from './board.service';
import { Board, BoardSchema } from './schemas/board.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Board.name, schema: BoardSchema },
    ]),
  ],
  controllers: [BoardController],
  providers: [BoardService],
})
export class BoardModule {}
