'use client';

import { Button } from '@/shared/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/ui/dialog';
import React, { useState, useTransition } from 'react';
import { deleteCardAction, updateCardAction } from '../cards.api';
import type { CardDto } from '../cards.schema';

interface CardModalProps {
  card: CardDto | null;
  boardId: string;
  isOpen: boolean;
  onClose: () => void;
  children?: React.ReactNode;
}

export function CardModal({ card, boardId, isOpen, onClose, children }: CardModalProps) {
  const [title, setTitle] = useState(card?.title ?? '');
  const [description, setDescription] = useState(card?.description ?? '');
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Keep in sync with card prop
  React.useEffect(() => {
    if (card) {
      setTitle(card.title);
      setDescription(card.description ?? '');
    }
  }, [card]);

  if (!card) return null;

  const handleTitleBlur = () => {
    if (!title.trim() || title === card.title) {
      setTitle(card.title);
      return;
    }

    startTransition(async () => {
      await updateCardAction({ cardId: card.id, title: title.trim() }, boardId);
    });
  };

  const handleSaveDescription = () => {
    setIsEditingDesc(false);
    startTransition(async () => {
      await updateCardAction({ cardId: card.id, description: description.trim() }, boardId);
    });
  };

  const handleDeleteCard = () => {
    if (confirm(`Delete card "${card.title}"?`)) {
      startTransition(async () => {
        await deleteCardAction({ cardId: card.id }, boardId);
        onClose();
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between pr-6">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={handleTitleBlur}
              className="w-full text-xl font-bold text-[#172B4D] px-1 py-0.5 rounded border border-transparent hover:border-[#DFE1E6] focus:border-[#0052CC] focus:outline-none"
            />
          </div>
        </DialogHeader>

        <div className="mt-6 flex flex-col gap-6">
          {/* Description Section */}
          <div className="flex flex-col gap-2">
            <h3 className="text-sm font-semibold text-[#172B4D] flex items-center gap-2">
              <span>📄</span> Description
            </h3>

            {isEditingDesc ? (
              <div className="flex flex-col gap-2">
                <textarea
                  value={description}
                  ref={(el) => el?.focus()}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Add a more detailed description..."
                  className="w-full min-h-[100px] p-2.5 text-sm bg-white rounded-lg border border-[#0052CC] text-[#172B4D] resize-y focus:outline-none"
                />
                <div className="flex items-center gap-2">
                  <Button size="sm" onClick={handleSaveDescription} disabled={isPending}>
                    Save
                  </Button>
                  <Button
                    size="sm"
                    variant="subtle"
                    onClick={() => {
                      setDescription(card.description ?? '');
                      setIsEditingDesc(false);
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsEditingDesc(true)}
                className="w-full text-left min-h-[64px] p-2.5 text-sm rounded-lg bg-[#091E420A] hover:bg-[#091E4214] text-[#172B4D] transition-colors"
              >
                {description ? (
                  <span className="whitespace-pre-wrap">{description}</span>
                ) : (
                  <span className="text-[#6B778C]">Add a more detailed description...</span>
                )}
              </button>
            )}
          </div>

          {/* Child Components (Checklists, Labels, Due Date, Activity) */}
          {children}

          {/* Actions Footer */}
          <div className="pt-4 border-t border-[#EBECF0] flex justify-end">
            <Button variant="danger" size="sm" onClick={handleDeleteCard} disabled={isPending}>
              Delete card
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
