import React from 'react';
import { format } from 'date-fns';
import { Clock, Trash2, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface HistoryItem {
  id: string;
  topic: string;
  created_at: string;
}

interface HistorySidebarProps {
  items: HistoryItem[];
  onSelect: (id: string) => void;
  selectedId?: string;
  onRefresh: () => void;
  isOpen: boolean;
  onClose: () => void;
}

const HistorySidebar: React.FC<HistorySidebarProps> = ({
  items,
  onSelect,
  selectedId,
  onRefresh,
  isOpen,
  onClose,
}) => {
  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const { error } = await supabase.from('generations').delete().eq('id', id);
    if (error) {
      toast.error('Failed to delete');
    } else {
      toast.success('Deleted');
      onRefresh();
    }
  };

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div className="fixed inset-0 bg-background/60 z-40 lg:hidden" onClick={onClose} />
      )}
      
      <aside
        className={`fixed lg:relative top-0 left-0 h-full z-50 lg:z-0 w-72 border-r border-border/50 bg-sidebar flex flex-col transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b border-border/50">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold">History</h3>
          </div>
          <button onClick={onClose} className="lg:hidden text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 scroll-fade">
          {items.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center mt-8 px-4">
              Your generation history will appear here
            </p>
          ) : (
            <div className="space-y-1">
              {items.map((item) => (
                <button
                  key={item.id}
                  onClick={() => { onSelect(item.id); onClose(); }}
                  className={`w-full text-left px-3 py-2.5 rounded-xl text-sm transition-all group ${
                    selectedId === item.id
                      ? 'bg-primary/10 text-foreground'
                      : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <span className="truncate font-medium text-xs flex-1">{item.topic}</span>
                    <button
                      onClick={(e) => handleDelete(item.id, e)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity ml-2 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                  <span className="text-[10px] text-muted-foreground/70 mt-0.5 block">
                    {format(new Date(item.created_at), 'MMM d, h:mm a')}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </aside>
    </>
  );
};

export default HistorySidebar;
