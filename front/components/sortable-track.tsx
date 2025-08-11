"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { UniqueIdentifier } from "@dnd-kit/core";
import { TrackRow } from "@/components/track-row";
import React from "react";

type Track = {
  id: number;
  title: string;
  artist: string;
  album: string;
  duration: string;
  artwork_url: string | null;
  audio_url: string;
  added_at: string;
};

type SortableTrackProps = {
  id: UniqueIdentifier;
  track: Track;
  index: number;
  queue: Track[];
  onRemoveFromPlaylist: (trackId: number) => void;
  isMobile: boolean;
  isReordering: boolean;
};

export function SortableTrack({
  id,
  track,
  index,
  queue,
  onRemoveFromPlaylist,
  isMobile,
  isReordering,
}: SortableTrackProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ 
    id,
    disabled: !isReordering
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <TrackRow
        track={track}
        index={index}
        queue={queue}
        onRemoveFromPlaylist={onRemoveFromPlaylist}
        attributes={attributes}
        dragHandleListeners={listeners}
        isDragging={isDragging}
        isMobile={isMobile}
        isReordering={isReordering}
      />
    </div>
  );
}