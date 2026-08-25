import React, { useEffect, useState } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Plus, Loader, GripVertical } from 'lucide-react';
import { usePageStore, Card, BoardList } from '../store/pageStore.js';
import { getSocket } from '../lib/socket.js';

/* ─── Sortable Card ──────────────────────────────── */
const SortableCard: React.FC<{ card: Card }> = ({ card }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: card._id || card.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    padding: '10px 12px',
    marginBottom: '6px',
    borderRadius: '8px',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid var(--border-subtle)',
    cursor: 'grab',
    userSelect: 'none',
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
        <GripVertical size={13} color="var(--text-dim)" style={{ marginTop: '2px', flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '0.88rem', fontWeight: 500, color: 'var(--text-main)' }}>
            {card.title}
          </div>
          {card.description && (
            <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginTop: '4px' }}>
              {card.description}
            </div>
          )}
          {card.labels && card.labels.length > 0 && (
            <div style={{ display: 'flex', gap: '4px', marginTop: '6px', flexWrap: 'wrap' }}>
              {card.labels.map((label, i) => (
                <span key={i} style={{
                  fontSize: '0.65rem', fontWeight: 600, padding: '1px 6px',
                  borderRadius: '999px', background: 'rgba(99,102,241,0.2)',
                  color: '#a5b4fc', border: '1px solid rgba(99,102,241,0.3)',
                }}>
                  {label}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/* ─── Board Column (List) ───────────────────────── */
const BoardColumn: React.FC<{
  list: BoardList;
  cards: Card[];
  pageId: string;
}> = ({ list, cards, pageId }) => {
  const { createCard } = usePageStore();
  const [showAdd, setShowAdd] = useState(false);
  const [newTitle, setNewTitle] = useState('');

  const sortedCards = [...cards].sort((a, b) => a.position - b.position);
  const cardIds = sortedCards.map(c => c._id || c.id);

  const handleAdd = async () => {
    if (!newTitle.trim()) return;
    await createCard(pageId, list._id || list.id, newTitle.trim());
    setNewTitle('');
    setShowAdd(false);
  };

  return (
    <div style={{
      width: '280px',
      minWidth: '280px',
      background: 'rgba(255,255,255,0.02)',
      borderRadius: '10px',
      border: '1px solid var(--border-subtle)',
      display: 'flex',
      flexDirection: 'column',
      maxHeight: '100%',
    }}>
      {/* List header */}
      <div style={{
        padding: '12px 14px',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#fff' }}>
          {list.title}
        </span>
        <span style={{
          fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-dim)',
          background: 'rgba(255,255,255,0.06)', padding: '1px 7px',
          borderRadius: '999px',
        }}>
          {cards.length}
        </span>
      </div>

      {/* Cards */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
        <SortableContext items={cardIds} strategy={verticalListSortingStrategy}>
          {sortedCards.map(card => (
            <SortableCard key={card._id || card.id} card={card} />
          ))}
        </SortableContext>

        {sortedCards.length === 0 && (
          <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.8rem' }}>
            No cards
          </div>
        )}
      </div>

      {/* Add card */}
      <div style={{ padding: '8px', borderTop: '1px solid var(--border-subtle)' }}>
        {showAdd ? (
          <div>
            <input
              autoFocus
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
              placeholder="Card title..."
              style={{
                width: '100%', padding: '7px 10px', borderRadius: '6px',
                background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-subtle)',
                color: 'var(--text-main)', fontSize: '0.82rem', marginBottom: '6px',
                outline: 'none', boxSizing: 'border-box',
              }}
            />
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                onClick={handleAdd}
                style={{
                  flex: 1, padding: '5px', borderRadius: '6px',
                  background: 'rgba(99,102,241,0.6)', border: 'none',
                  color: '#fff', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer',
                }}
              >
                Add
              </button>
              <button
                onClick={() => { setShowAdd(false); setNewTitle(''); }}
                style={{
                  padding: '5px 10px', borderRadius: '6px',
                  background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-subtle)',
                  color: 'var(--text-dim)', fontSize: '0.78rem', cursor: 'pointer',
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowAdd(true)}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: '6px',
              padding: '6px 10px', borderRadius: '6px',
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--text-dim)', fontSize: '0.82rem',
            }}
          >
            <Plus size={13} /> Add card
          </button>
        )}
      </div>
    </div>
  );
};

/* ─── Board View ────────────────────────────────── */
interface BoardViewProps {
  pageId: string;
  pageTitle: string;
}

export const BoardView: React.FC<BoardViewProps> = ({ pageId, pageTitle }) => {
  const { lists, cards, isLoadingBoard, fetchBoard, moveCard, moveCardLocal, rollbackCards, createList } = usePageStore();
  const [activeCard, setActiveCard] = useState<Card | null>(null);
  const [showAddList, setShowAddList] = useState(false);
  const [newListTitle, setNewListTitle] = useState('');

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  useEffect(() => {
    fetchBoard(pageId);

    // Socket.io: listen for card:moved from other users
    const socket = getSocket();
    const handler = (data: any) => {
      if (data.card?.pageId === pageId) {
        fetchBoard(pageId); // re-fetch to sync
      }
    };
    socket.on('card:moved', handler);
    return () => { socket.off('card:moved', handler); };
  }, [pageId]);

  const handleDragStart = (event: DragStartEvent) => {
    const card = cards.find(c => (c._id || c.id) === event.active.id);
    setActiveCard(card || null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveCard(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const draggedCard = cards.find(c => (c._id || c.id) === active.id);
    if (!draggedCard) return;

    // Find which list the card was dropped over
    const overCard = cards.find(c => (c._id || c.id) === over.id);
    const targetListId = overCard ? overCard.listId : draggedCard.listId;
    const targetPosition = overCard ? overCard.position : 0;

    // Optimistic update
    const prevCards = [...cards];
    moveCardLocal(draggedCard._id || draggedCard.id, targetListId, targetPosition);

    try {
      await moveCard(draggedCard._id || draggedCard.id, targetListId, targetPosition);
    } catch {
      // Rollback on failure
      rollbackCards(prevCards);
    }
  };

  const handleAddList = async () => {
    if (!newListTitle.trim()) return;
    await createList(pageId, newListTitle.trim());
    setNewListTitle('');
    setShowAddList(false);
  };

  if (isLoadingBoard) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '10px' }}>
        <Loader size={20} color="var(--text-dim)" className="animate-spin" />
        <span style={{ color: 'var(--text-dim)' }}>Loading board...</span>
      </div>
    );
  }

  const sortedLists = [...lists].sort((a, b) => a.position - b.position);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Board header */}
      <div style={{ padding: '20px 24px 12px', borderBottom: '1px solid var(--border-subtle)' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff', margin: 0 }}>
          📋 {pageTitle}
        </h1>
        <p style={{ color: 'var(--text-dim)', fontSize: '0.82rem', marginTop: '4px' }}>
          Drag cards between lists • Changes sync in real-time via Socket.io
        </p>
      </div>

      {/* Board columns */}
      <div style={{
        flex: 1, display: 'flex', gap: '16px', padding: '16px 24px',
        overflowX: 'auto', overflowY: 'hidden', alignItems: 'flex-start',
      }}>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          {sortedLists.map(list => (
            <BoardColumn
              key={list._id || list.id}
              list={list}
              cards={cards.filter(c => c.listId === (list._id || list.id))}
              pageId={pageId}
            />
          ))}

          <DragOverlay>
            {activeCard && (
              <div style={{
                padding: '10px 12px', borderRadius: '8px',
                background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.4)',
                boxShadow: '0 8px 24px rgba(0,0,0,0.4)', width: '260px',
              }}>
                <div style={{ fontSize: '0.88rem', fontWeight: 500, color: '#fff' }}>
                  {activeCard.title}
                </div>
              </div>
            )}
          </DragOverlay>
        </DndContext>

        {/* Add list */}
        {showAddList ? (
          <div style={{
            minWidth: '280px', padding: '12px', borderRadius: '10px',
            background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-subtle)',
          }}>
            <input
              autoFocus
              value={newListTitle}
              onChange={e => setNewListTitle(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAddList()}
              placeholder="List title..."
              style={{
                width: '100%', padding: '7px 10px', borderRadius: '6px',
                background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-subtle)',
                color: 'var(--text-main)', fontSize: '0.85rem', marginBottom: '8px',
                outline: 'none', boxSizing: 'border-box',
              }}
            />
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                onClick={handleAddList}
                style={{
                  flex: 1, padding: '6px', borderRadius: '6px',
                  background: 'rgba(99,102,241,0.6)', border: 'none',
                  color: '#fff', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer',
                }}
              >
                Add List
              </button>
              <button
                onClick={() => setShowAddList(false)}
                style={{
                  padding: '6px 12px', borderRadius: '6px',
                  background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-subtle)',
                  color: 'var(--text-dim)', fontSize: '0.82rem', cursor: 'pointer',
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowAddList(true)}
            style={{
              minWidth: '200px', padding: '12px 16px', borderRadius: '10px',
              background: 'rgba(255,255,255,0.02)', border: '1px dashed var(--border-subtle)',
              color: 'var(--text-dim)', fontSize: '0.85rem', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '8px',
            }}
          >
            <Plus size={15} /> Add List
          </button>
        )}
      </div>
    </div>
  );
};
