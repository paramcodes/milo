'use client';

import { moveCardAction } from '@/features/cards/cards.api';
import { AddCardInput } from '@/features/cards/components/add-card-input';
import { CardModal } from '@/features/cards/components/card-modal';
import { CardTile } from '@/features/cards/components/card-tile';
import { AddListInput } from '@/features/lists/components/add-list-input';
import { ListColumn } from '@/features/lists/components/list-column';
import { reorderListsAction } from '@/features/lists/lists.api';
import { calculateReorderedPosition } from '@/shared/calc/reorder.calc';
import { DragDropContext, Draggable, type DropResult, Droppable } from '@hello-pangea/dnd';
import React, { useEffect, useState, useTransition } from 'react';
import type { BoardDetailDto } from '../boards.schema';
import { BoardHeader } from './board-header';
import { ClientOnlyDnd } from './dnd-context';

interface BoardCanvasProps {
  board: BoardDetailDto;
  onCardClick?: (cardId: string) => void;
}

export function BoardCanvas({ board, onCardClick }: BoardCanvasProps) {
  const [lists, setLists] = useState(board.lists);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const selectedCard = selectedCardId
    ? (lists.flatMap((l) => l.cards).find((c) => c.id === selectedCardId) ?? null)
    : null;

  // Sync state when props change
  useEffect(() => {
    setLists(board.lists);
  }, [board.lists]);

  const onDragEnd = (result: DropResult) => {
    const { destination, source, type, draggableId } = result;
    if (!destination) return;

    if (destination.droppableId === source.droppableId && destination.index === source.index) {
      return;
    }

    // 1. Reordering Lists horizontally
    if (type === 'list') {
      const reordered = calculateReorderedPosition(lists, source.index, destination.index);
      setLists(reordered);

      startTransition(async () => {
        await reorderListsAction({
          boardId: board.id,
          listIds: reordered.map((l) => l.id),
        });
      });
      return;
    }

    // 2. Moving Cards within or between Lists
    const sourceList = lists.find((l) => l.id === source.droppableId);
    const destList = lists.find((l) => l.id === destination.droppableId);
    if (!sourceList || !destList) return;

    // Moving within the same list
    if (source.droppableId === destination.droppableId) {
      const reorderedCards = calculateReorderedPosition(
        sourceList.cards,
        source.index,
        destination.index,
      );

      const newLists = lists.map((l) =>
        l.id === sourceList.id ? { ...l, cards: reorderedCards } : l,
      );
      setLists(newLists);

      const movedCard = reorderedCards[destination.index];
      if (movedCard) {
        startTransition(async () => {
          await moveCardAction(
            {
              cardId: draggableId,
              targetListId: destination.droppableId,
              newPosition: movedCard.position,
            },
            board.id,
          );
        });
      }
      return;
    }

    // Moving between different lists
    const sourceCards = Array.from(sourceList.cards);
    const destCards = Array.from(destList.cards);
    const [movedCard] = sourceCards.splice(source.index, 1);
    if (!movedCard) return;

    destCards.splice(destination.index, 0, movedCard);

    // Calculate new position in destination list
    const reorderedDestCards = destCards.map((card, idx) => ({
      ...card,
      position: (idx + 1) * 1000,
    }));

    const newLists = lists.map((l) => {
      if (l.id === sourceList.id) return { ...l, cards: sourceCards };
      if (l.id === destList.id) return { ...l, cards: reorderedDestCards };
      return l;
    });

    setLists(newLists);

    const targetCard = reorderedDestCards[destination.index];
    if (targetCard) {
      startTransition(async () => {
        await moveCardAction(
          {
            cardId: draggableId,
            targetListId: destination.droppableId,
            newPosition: targetCard.position,
          },
          board.id,
        );
      });
    }
  };

  return (
    <div
      className="flex-1 flex flex-col min-h-0 overflow-hidden"
      style={{ backgroundColor: board.color || '#0052CC' }}
    >
      <BoardHeader boardId={board.id} initialTitle={board.title} initialColor={board.color} />

      <div className="flex-1 flex items-start gap-3 p-4 overflow-x-auto min-h-0">
        <ClientOnlyDnd
          fallback={
            <div className="flex items-start gap-3">
              {lists.map((list) => (
                <ListColumn
                  key={list.id}
                  id={list.id}
                  title={list.title}
                  boardId={board.id}
                  footer={<AddCardInput listId={list.id} boardId={board.id} />}
                >
                  {list.cards.map((card) => (
                    <CardTile
                      key={card.id}
                      id={card.id}
                      title={card.title}
                      dueDate={card.dueDate}
                      isCompleted={card.isCompleted}
                      labels={card.labels}
                      checklists={card.checklists}
                      onClick={() => {
                        setSelectedCardId(card.id);
                        onCardClick?.(card.id);
                      }}
                    />
                  ))}
                </ListColumn>
              ))}
              <AddListInput boardId={board.id} />
            </div>
          }
        >
          <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="board" direction="horizontal" type="list">
              {(provided) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className="flex items-start gap-3"
                >
                  {lists.map((list, listIndex) => (
                    <Draggable key={list.id} draggableId={list.id} index={listIndex}>
                      {(listDragProvided) => (
                        <div
                          ref={listDragProvided.innerRef}
                          {...listDragProvided.draggableProps}
                          {...listDragProvided.dragHandleProps}
                        >
                          <ListColumn
                            id={list.id}
                            title={list.title}
                            boardId={board.id}
                            footer={<AddCardInput listId={list.id} boardId={board.id} />}
                          >
                            <Droppable droppableId={list.id} type="card">
                              {(cardDropProvided) => (
                                <div
                                  ref={cardDropProvided.innerRef}
                                  {...cardDropProvided.droppableProps}
                                  className="flex flex-col gap-2 min-h-2"
                                >
                                  {list.cards.map((card, cardIndex) => (
                                    <Draggable
                                      key={card.id}
                                      draggableId={card.id}
                                      index={cardIndex}
                                    >
                                      {(cardDragProvided) => (
                                        <div
                                          ref={cardDragProvided.innerRef}
                                          {...cardDragProvided.draggableProps}
                                          {...cardDragProvided.dragHandleProps}
                                        >
                                          <CardTile
                                            id={card.id}
                                            title={card.title}
                                            dueDate={card.dueDate}
                                            isCompleted={card.isCompleted}
                                            labels={card.labels}
                                            checklists={card.checklists}
                                            onClick={() => {
                                              setSelectedCardId(card.id);
                                              onCardClick?.(card.id);
                                            }}
                                          />
                                        </div>
                                      )}
                                    </Draggable>
                                  ))}
                                  {cardDropProvided.placeholder}
                                </div>
                              )}
                            </Droppable>
                          </ListColumn>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                  <AddListInput boardId={board.id} />
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </ClientOnlyDnd>
      </div>

      <CardModal
        card={selectedCard}
        boardId={board.id}
        isOpen={!!selectedCard}
        onClose={() => setSelectedCardId(null)}
      />
    </div>
  );
}
