"use client";

import * as React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export interface CollaboratorUser {
  clientId: number;
  name: string;
  color: string;
  avatarUrl?: string | null;
}

interface CollaboratorAvatarsProps {
  collaborators: CollaboratorUser[];
}

export function CollaboratorAvatars({ collaborators }: CollaboratorAvatarsProps) {
  if (!collaborators || collaborators.length === 0) {
    return null;
  }

  const displayed = collaborators.slice(0, 4);
  const remaining = collaborators.length - displayed.length;

  return (
    <div className="flex items-center -space-x-1.5 overflow-hidden">
      {displayed.map((c) => {
        const initials = c.name
          .split(" ")
          .map((n) => n[0])
          .join("")
          .toUpperCase()
          .slice(0, 2);

        return (
          <Tooltip key={c.clientId}>
            <TooltipTrigger asChild>
              <div
                className="relative rounded-full ring-2 transition-transform hover:scale-110 hover:z-10"
                style={{ ["--tw-ring-color" as string]: c.color }}
              >
                <Avatar className="h-7 w-7 border border-background">
                  {c.avatarUrl && <AvatarImage src={c.avatarUrl} alt={c.name} />}
                  <AvatarFallback
                    style={{ backgroundColor: `${c.color}25`, color: c.color }}
                    className="text-[10px] font-bold"
                  >
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              <span className="font-semibold">{c.name}</span> (Editing)
            </TooltipContent>
          </Tooltip>
        );
      })}

      {remaining > 0 && (
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex h-7 w-7 items-center justify-center rounded-full border border-background bg-muted text-[10px] font-bold text-muted-foreground ring-1 ring-border">
              +{remaining}
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-xs">
            {remaining} other collaborator{remaining > 1 ? "s" : ""} active
          </TooltipContent>
        </Tooltip>
      )}
    </div>
  );
}
