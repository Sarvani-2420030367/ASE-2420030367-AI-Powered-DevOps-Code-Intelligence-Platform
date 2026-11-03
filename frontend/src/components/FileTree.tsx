import React, { useState } from 'react';
import { FileTreeNode } from '../types';
import { Folder, FolderOpen, FileCode, ChevronRight, ChevronDown } from 'lucide-react';

interface FileTreeProps {
  nodes: FileTreeNode[];
  selectedPath: string | null;
  onSelectFile: (path: string) => void;
}

export const FileTree: React.FC<FileTreeProps> = ({ nodes, selectedPath, onSelectFile }) => {
  return (
    <div className="text-xs font-mono select-none overflow-y-auto max-h-[650px] pr-2">
      {nodes.map((node) => (
        <FileTreeItem
          key={node.path}
          node={node}
          selectedPath={selectedPath}
          onSelectFile={onSelectFile}
          depth={0}
        />
      ))}
    </div>
  );
};

const FileTreeItem: React.FC<{
  node: FileTreeNode;
  selectedPath: string | null;
  onSelectFile: (path: string) => void;
  depth: number;
}> = ({ node, selectedPath, onSelectFile, depth }) => {
  const [isOpen, setIsOpen] = useState(depth < 1);
  const isSelected = selectedPath === node.path;
  const isDirectory = node.type === 'directory';

  const handleClick = () => {
    if (isDirectory) {
      setIsOpen(!isOpen);
    } else {
      onSelectFile(node.path);
    }
  };

  return (
    <div>
      <div
        onClick={handleClick}
        style={{ paddingLeft: `${depth * 14 + 8}px` }}
        className={`flex items-center justify-between py-1.5 px-2 rounded-md cursor-pointer transition-colors ${
          isSelected
            ? 'bg-sky-500/15 text-sky-400 font-semibold border border-sky-500/30'
            : 'text-slate-300 hover:bg-slate-800/60'
        }`}
      >
        <div className="flex items-center gap-2 truncate">
          {isDirectory ? (
            <>
              {isOpen ? (
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              )}
              {isOpen ? (
                <FolderOpen className="w-3.5 h-3.5 text-sky-400 shrink-0" />
              ) : (
                <Folder className="w-3.5 h-3.5 text-sky-400 shrink-0" />
              )}
            </>
          ) : (
            <>
              <span className="w-3.5" />
              <FileCode className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            </>
          )}
          <span className="truncate">{node.name}</span>
        </div>

        {node.size !== undefined && !isDirectory && (
          <span className="text-[10px] text-slate-400 font-mono ml-2 shrink-0">
            {(node.size / 1024).toFixed(1)}k
          </span>
        )}
      </div>

      {isDirectory && isOpen && node.children && (
        <div>
          {node.children.map((child) => (
            <FileTreeItem
              key={child.path}
              node={child}
              selectedPath={selectedPath}
              onSelectFile={onSelectFile}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};
