import React, { useState, useRef, useMemo } from 'react';
import {
  Plus,
  Edit2,
  Trash2,
  Check,
  X,
  Tag,
  UtensilsCrossed,
  Download,
  Upload,
  Layers,
  Sparkles,
  Camera,
  Image as ImageIcon,
  Crop,
  Search,
  Filter,
  Package,
  AlertTriangle,
  FileSpreadsheet,
  FileText,
  CheckCircle2,
  RotateCcw,
  Archive,
  AlertCircle,
  Link2,
  Globe,
  ExternalLink,
  RefreshCw
} from 'lucide-react';
import type { Category, Item, ItemVariant, RestaurantProfile } from '../types';
import { formatPaise, rupeesToPaise } from '../utils/currency';
import { searchMenuItems } from '../utils/search';
import { db } from '../db';
import { ImageCropperModal } from './ImageCropperModal';
import { ExportModal } from './ExportModal';
import { customAlert, customConfirm } from './CustomDialog';
import { getAutoFoodImageUrl } from '../utils/foodImages';
import { exportMenuToExcel } from '../utils/excel';
import { exportMenuToPdf } from '../utils/pdfExport';
import { saveAndShareFile } from '../utils/fileExport';

interface MenuManagerProps {
  categories: Category[];
  items: Item[];
  profile: RestaurantProfile;
  onRefreshData: () => void;
  globalSearch?: string;
  onClearGlobalSearch?: () => void;
}

export type InventoryTab = 'all' | 'in_stock' | 'out_of_stock' | 'deleted';

export const MenuManager: React.FC<MenuManagerProps> = ({
  categories,
  items,
  profile,
  onRefreshData,
  globalSearch = '',
  onClearGlobalSearch,
}) => {
  // Inventory status view tab
  const [currentTab, setCurrentTab] = useState<InventoryTab>('all');
  const [selectedCatId, setSelectedCatId] = useState<string>('all');
  const [dietaryFilter, setDietaryFilter] = useState<'all' | 'veg' | 'nonveg'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [isNewItem, setIsNewItem] = useState<boolean>(false);

  // New / Edit Item Form State
  const [formName, setFormName] = useState<string>('');
  const [formShortName, setFormShortName] = useState<string>('');
  const [formNameHindi, setFormNameHindi] = useState<string>('');
  const [formCategoryId, setFormCategoryId] = useState<string>('');
  const [formPriceRupees, setFormPriceRupees] = useState<string>('');
  const [formTaxPercent, setFormTaxPercent] = useState<number>(5);
  const [formIsVeg, setFormIsVeg] = useState<boolean>(true);
  const [formIsOutOfStock, setFormIsOutOfStock] = useState<boolean>(false);
  const [formStockQty, setFormStockQty] = useState<string>('');
  const [formVariants, setFormVariants] = useState<ItemVariant[]>([]);
  const [formImageUrl, setFormImageUrl] = useState<string | undefined>(undefined);

  // Google / Web Image URL State
  const [imageTab, setImageTab] = useState<'upload' | 'url'>('upload');
  const [imageLinkInput, setImageLinkInput] = useState<string>('');
  const [imageLinkLoading, setImageLinkLoading] = useState<boolean>(false);
  const [imageLinkError, setImageLinkError] = useState<string | null>(null);

  // Cropper State
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const jsonImportRef = useRef<HTMLInputElement | null>(null);
  const [cropperOpen, setCropperOpen] = useState<boolean>(false);
  const [cropImageSrc, setCropImageSrc] = useState<string>('');

  // Category Modal State
  const [categoryModalOpen, setCategoryModalOpen] = useState<boolean>(false);
  const [newCatName, setNewCatName] = useState<string>('');

  // Export Catalogue Modal State
  const [exportModalOpen, setExportModalOpen] = useState<boolean>(false);

  // Partition items into active and deleted
  const activeItems = useMemo(() => items.filter((i) => !i.isDeleted), [items]);
  const inStockItems = useMemo(() => activeItems.filter((i) => !i.isOutOfStock && i.isActive), [activeItems]);
  const outOfStockItems = useMemo(() => activeItems.filter((i) => i.isOutOfStock || !i.isActive), [activeItems]);
  const deletedItems = useMemo(() => items.filter((i) => i.isDeleted), [items]);

  // Effective search query combining top header search and local inventory search
  const effectiveSearch = (globalSearch || searchQuery).trim();

  // Filtered items based on current tab, search, category, and dietary using fuzzy search
  const filteredItems = useMemo(() => {
    let source = activeItems;
    if (currentTab === 'in_stock') source = inStockItems;
    else if (currentTab === 'out_of_stock') source = outOfStockItems;
    else if (currentTab === 'deleted') source = deletedItems;

    let base = source.filter((item) => {
      if (selectedCatId !== 'all' && item.categoryId !== selectedCatId) return false;
      if (dietaryFilter === 'veg' && !item.isVeg) return false;
      if (dietaryFilter === 'nonveg' && item.isVeg) return false;
      return true;
    });

    if (!effectiveSearch) return base;

    return searchMenuItems(base, effectiveSearch, categories);
  }, [activeItems, inStockItems, outOfStockItems, deletedItems, currentTab, selectedCatId, dietaryFilter, effectiveSearch, categories]);

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setCropImageSrc(reader.result);
        setCropperOpen(true);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleCropComplete = (croppedBase64: string) => {
    setFormImageUrl(croppedBase64);
    setCropperOpen(false);
  };

  const handleApplyWebImageUrl = (crop: boolean) => {
    const url = imageLinkInput.trim();
    if (!url) {
      setImageLinkError('Please paste a valid image URL first.');
      return;
    }
    setImageLinkLoading(true);
    setImageLinkError(null);

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      setImageLinkLoading(false);
      if (crop) {
        setCropImageSrc(url);
        setCropperOpen(true);
      } else {
        setFormImageUrl(url);
      }
    };
    img.onerror = () => {
      // Even if CORS blocks canvas read, direct image rendering in img tag usually succeeds
      setImageLinkLoading(false);
      if (crop) {
        setCropImageSrc(url);
        setCropperOpen(true);
      } else {
        setFormImageUrl(url);
      }
    };
    img.src = url;
  };

  const openAddItemModal = () => {
    setIsNewItem(true);
    setFormName('');
    setFormShortName('');
    setFormNameHindi('');
    setFormCategoryId(categories[0]?.id || '');
    setFormPriceRupees('');
    setFormTaxPercent(profile.defaultGstPercent || 5);
    setFormIsVeg(true);
    setFormIsOutOfStock(false);
    setFormStockQty('');
    setFormVariants([]);
    setFormImageUrl(undefined);
    setImageLinkInput('');
    setImageLinkError(null);
    setImageLinkLoading(false);
    setImageTab('upload');
    setEditingItem({
      id: `item_${Date.now()}`,
      categoryId: categories[0]?.id || '',
      name: '',
      shortName: '',
      basePrice: 0,
      taxPercent: 5,
      isVeg: true,
      isActive: true,
      isOutOfStock: false,
      sortOrder: items.length + 1,
    });
  };

  const openEditItemModal = (item: Item) => {
    setIsNewItem(false);
    setEditingItem(item);
    setFormName(item.name);
    setFormShortName(item.shortName);
    setFormNameHindi(item.nameHindi || '');
    setFormCategoryId(item.categoryId);
    setFormPriceRupees((item.basePrice / 100).toString());
    setFormTaxPercent(item.taxPercent);
    setFormIsVeg(item.isVeg);
    setFormIsOutOfStock(!!item.isOutOfStock || !item.isActive);
    setFormStockQty(item.stockQty !== undefined ? item.stockQty.toString() : '');
    setFormVariants(item.variants ? [...item.variants] : []);
    setFormImageUrl(item.imageUrl);
    setImageLinkInput(item.imageUrl?.startsWith('http') ? item.imageUrl : '');
    setImageLinkError(null);
    setImageLinkLoading(false);
    setImageTab(item.imageUrl?.startsWith('http') ? 'url' : 'upload');
  };

  const handleSaveItem = async () => {
    if (!formName.trim() || !formCategoryId) {
      customAlert('Product name and category are required.', 'Missing Fields', 'warning');
      return;
    }

    const pricePaise = rupeesToPaise(formPriceRupees);
    const parsedQty = formStockQty.trim() ? parseInt(formStockQty, 10) : undefined;

    const itemData: Item = {
      id: editingItem?.id || `item_${Date.now()}`,
      categoryId: formCategoryId,
      name: formName.trim(),
      shortName: (formShortName.trim() || formName.trim()).slice(0, 16),
      nameHindi: formNameHindi.trim() || undefined,
      basePrice: pricePaise,
      taxPercent: formTaxPercent,
      isVeg: formIsVeg,
      isActive: !formIsOutOfStock,
      isOutOfStock: formIsOutOfStock,
      stockQty: parsedQty,
      isDeleted: false,
      sortOrder: editingItem?.sortOrder || items.length + 1,
      imageUrl: formImageUrl,
      variants: formVariants.length > 0 ? formVariants : undefined,
    };

    if (isNewItem) {
      await db.items.add(itemData);
    } else {
      await db.items.put(itemData);
    }

    setEditingItem(null);
    onRefreshData();
  };

  // Toggle Out of Stock
  const handleToggleStock = async (item: Item) => {
    const nextOutOfStock = !item.isOutOfStock;
    await db.items.update(item.id, {
      isOutOfStock: nextOutOfStock,
      isActive: !nextOutOfStock,
    });
    onRefreshData();
  };

  // Soft Delete to Trash
  const handleSoftDelete = async (item: Item) => {
    const confirmed = await customConfirm(
      `Move "${item.name}" to Deleted / Trash? You can restore it anytime.`,
      'Move to Trash',
      'Move to Trash',
      'Cancel',
      true
    );
    if (confirmed) {
      await db.items.update(item.id, {
        isDeleted: true,
        deletedAt: Date.now(),
      });
      onRefreshData();
    }
  };

  // Restore deleted item
  const handleRestore = async (item: Item) => {
    await db.items.update(item.id, {
      isDeleted: false,
      deletedAt: undefined,
    });
    onRefreshData();
  };

  // Permanently delete
  const handlePermanentDelete = async (item: Item) => {
    const confirmed = await customConfirm(
      `Permanently delete "${item.name}"? This cannot be undone.`,
      'Delete Permanently',
      'Delete Forever',
      'Cancel',
      true
    );
    if (confirmed) {
      await db.items.delete(item.id);
      onRefreshData();
    }
  };

  // Empty Trash
  const handleEmptyTrash = async () => {
    if (deletedItems.length === 0) return;
    const confirmed = await customConfirm(
      `Permanently delete all ${deletedItems.length} products in Trash?`,
      'Empty Trash',
      'Empty All',
      'Cancel',
      true
    );
    if (confirmed) {
      const ids = deletedItems.map((i) => i.id);
      await db.items.bulkDelete(ids);
      onRefreshData();
    }
  };

  // Variants handlers
  const handleAddVariantRow = () => {
    setFormVariants((prev) => [
      ...prev,
      { id: `var_${Date.now()}`, label: 'Regular', price: rupeesToPaise(formPriceRupees) || 0 },
    ]);
  };

  const handleUpdateVariant = (index: number, key: keyof ItemVariant, value: any) => {
    setFormVariants((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [key]: value };
      return next;
    });
  };

  const handleRemoveVariant = (index: number) => {
    setFormVariants((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: 'calc(100dvh - 62px)',
        backgroundColor: '#FFFFFF',
        padding: '8px 12px',
        paddingBottom: '76px',
        overflowY: 'auto',
      }}
    >
      <div style={{ maxWidth: '1360px', margin: '0 auto', width: '100%', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {/* Top Header Row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '8px',
          }}
        >
          {/* Title & Count */}
          <div>
            <h1
              style={{
                fontSize: '20px',
                fontWeight: 900,
                color: 'var(--text-main)',
                margin: 0,
                letterSpacing: '-0.02em',
              }}
            >
              Products
            </h1>
            <p style={{ fontSize: '11.5px', color: '#64748B', margin: '1px 0 0 0' }}>
              {activeItems.length} products · {inStockItems.length} in stock · {outOfStockItems.length} out of stock
            </p>
          </div>

          {/* Top Actions: Import, Export, + Add Product - STRICTLY ONE LINE */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              flexWrap: 'nowrap',
            }}
          >
            {currentTab === 'deleted' ? (
              <button
                onClick={handleEmptyTrash}
                disabled={deletedItems.length === 0}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '7px 12px',
                  borderRadius: '10px',
                  backgroundColor: '#DC2626',
                  color: '#FFFFFF',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: deletedItems.length > 0 ? 'pointer' : 'default',
                  opacity: deletedItems.length > 0 ? 1 : 0.5,
                  border: 'none',
                  whiteSpace: 'nowrap',
                }}
              >
                <Trash2 size={13} />
                <span>Empty Trash ({deletedItems.length})</span>
              </button>
            ) : (
              <>
                <button
                  onClick={() => jsonImportRef.current?.click()}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '7px 11px',
                    borderRadius: '9px',
                    backgroundColor: '#FFFFFF',
                    border: '1px solid var(--border-color)',
                    color: '#334155',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                  title="Import Products (JSON)"
                >
                  <Upload size={13} color="#64748B" />
                  <span>Import</span>
                </button>
                <input
                  ref={jsonImportRef}
                  type="file"
                  accept=".json,application/json"
                  style={{ display: 'none' }}
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      try {
                        const text = await file.text();
                        const parsed = JSON.parse(text);

                        if (parsed && typeof parsed === 'object' && Array.isArray(parsed.items)) {
                          if (Array.isArray(parsed.categories) && parsed.categories.length > 0) {
                            await db.categories.bulkPut(parsed.categories);
                          }
                          await db.items.bulkPut(parsed.items);
                          onRefreshData();
                          customAlert(
                            `Successfully imported complete menu catalogue!\n• ${parsed.items.length} Products with photos & pricing\n• ${parsed.categories?.length || 0} Categories`,
                            'Menu Imported',
                            'info'
                          );
                        } else if (Array.isArray(parsed)) {
                          await db.items.bulkPut(parsed);
                          onRefreshData();
                          customAlert(`Imported ${parsed.length} products successfully!`, 'Import Complete', 'info');
                        } else {
                          customAlert('Unrecognized file format. Please select a valid Billing Pro menu backup JSON file.', 'Import Failed', 'error');
                        }
                      } catch (err: any) {
                        customAlert(`Failed to parse backup file: ${err.message || 'Invalid JSON format'}`, 'Import Failed', 'error');
                      }
                    }
                    e.target.value = '';
                  }}
                />

                <button
                  onClick={() => setExportModalOpen(true)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '7px 11px',
                    borderRadius: '9px',
                    backgroundColor: '#FFFFFF',
                    border: '1px solid var(--border-color)',
                    color: '#334155',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                  title="Export Catalogue in Excel or PDF"
                >
                  <Download size={13} color="#64748B" />
                  <span>Export</span>
                </button>

                <button
                  onClick={openAddItemModal}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '7px 13px',
                    borderRadius: '9px',
                    backgroundColor: '#2563EB',
                    color: '#FFFFFF',
                    fontSize: '12px',
                    fontWeight: 800,
                    cursor: 'pointer',
                    border: 'none',
                    boxShadow: '0 2px 6px rgba(37, 99, 235, 0.25)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  <Plus size={15} strokeWidth={2.5} />
                  <span>Add Product</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Detailed Status Tabs: All | In Stock | Out of Stock | Deleted/Trash (No wrapping) */}
        <div
          style={{
            display: 'flex',
            gap: '6px',
            borderBottom: '1px solid var(--border-color)',
            paddingBottom: '8px',
            overflowX: 'auto',
            scrollbarWidth: 'none',
          }}
        >
          <button
            onClick={() => setCurrentTab('all')}
            style={{
              padding: '6px 12px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: currentTab === 'all' ? '#2563EB' : 'transparent',
              color: currentTab === 'all' ? '#FFFFFF' : '#475569',
              fontWeight: currentTab === 'all' ? 800 : 600,
              fontSize: '12.5px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
          >
            <span>All Products</span>
            <span
              style={{
                fontSize: '11px',
                padding: '1px 6px',
                borderRadius: '999px',
                backgroundColor: currentTab === 'all' ? 'rgba(255, 255, 255, 0.25)' : '#F1F5F9',
                color: currentTab === 'all' ? '#FFFFFF' : '#64748B',
                fontWeight: 700,
              }}
            >
              {activeItems.length}
            </span>
          </button>

          <button
            onClick={() => setCurrentTab('in_stock')}
            style={{
              padding: '6px 12px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: currentTab === 'in_stock' ? '#10B981' : 'transparent',
              color: currentTab === 'in_stock' ? '#FFFFFF' : '#475569',
              fontWeight: currentTab === 'in_stock' ? 800 : 600,
              fontSize: '12.5px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
          >
            <span>In Stock</span>
            <span
              style={{
                fontSize: '11px',
                padding: '1px 6px',
                borderRadius: '999px',
                backgroundColor: currentTab === 'in_stock' ? 'rgba(255, 255, 255, 0.25)' : 'rgba(16, 185, 129, 0.12)',
                color: currentTab === 'in_stock' ? '#FFFFFF' : '#10B981',
                fontWeight: 700,
              }}
            >
              {inStockItems.length}
            </span>
          </button>

          <button
            onClick={() => setCurrentTab('out_of_stock')}
            style={{
              padding: '6px 12px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: currentTab === 'out_of_stock' ? '#F59E0B' : 'transparent',
              color: currentTab === 'out_of_stock' ? '#FFFFFF' : '#475569',
              fontWeight: currentTab === 'out_of_stock' ? 800 : 600,
              fontSize: '12.5px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
          >
            <span>Out of Stock</span>
            <span
              style={{
                fontSize: '11px',
                padding: '1px 6px',
                borderRadius: '999px',
                backgroundColor: currentTab === 'out_of_stock' ? 'rgba(255, 255, 255, 0.25)' : 'rgba(245, 158, 11, 0.15)',
                color: currentTab === 'out_of_stock' ? '#FFFFFF' : '#F59E0B',
                fontWeight: 700,
              }}
            >
              {outOfStockItems.length}
            </span>
          </button>

          <button
            onClick={() => setCurrentTab('deleted')}
            style={{
              padding: '6px 12px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: currentTab === 'deleted' ? '#EF4444' : 'transparent',
              color: currentTab === 'deleted' ? '#FFFFFF' : '#475569',
              fontWeight: currentTab === 'deleted' ? 800 : 600,
              fontSize: '12.5px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
          >
            <Archive size={13} />
            <span>Trash</span>
            <span
              style={{
                fontSize: '11px',
                padding: '1px 6px',
                borderRadius: '999px',
                backgroundColor: currentTab === 'deleted' ? 'rgba(255, 255, 255, 0.25)' : 'rgba(239, 68, 68, 0.12)',
                color: currentTab === 'deleted' ? '#FFFFFF' : '#EF4444',
                fontWeight: 700,
              }}
            >
              {deletedItems.length}
            </span>
          </button>
        </div>

        {/* Filter and Search Bar with Compact Ergonomics */}
        <div
          className="mobile-filter-stack"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            flexWrap: 'wrap',
          }}
        >
          {/* Search Bar */}
          <div
            className="mobile-search-full"
            style={{
              flex: 'none',
              width: '100%',
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <Search size={15} color="#94A3B8" style={{ position: 'absolute', left: '12px' }} />
            <input
              type="text"
              placeholder="Search product name, SKU, or HSN..."
              value={globalSearch ? globalSearch : searchQuery}
              onChange={(e) => {
                if (globalSearch && onClearGlobalSearch) {
                  onClearGlobalSearch();
                }
                setSearchQuery(e.target.value);
              }}
              style={{
                width: '100%',
                height: '38px',
                borderRadius: '10px',
                border: `1px solid ${globalSearch ? '#2563EB' : 'var(--border-color)'}`,
                backgroundColor: '#FFFFFF',
                paddingLeft: '36px',
                paddingRight: '32px',
                fontSize: '13px',
                color: 'var(--text-main)',
                outline: 'none',
                boxShadow: '0 1px 2px rgba(0, 0, 0, 0.03)',
              }}
            />
            {(searchQuery || globalSearch) && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  if (onClearGlobalSearch) onClearGlobalSearch();
                }}
                style={{ position: 'absolute', right: '8px', background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: '4px' }}
                title="Clear product search"
              >
                <X size={15} />
              </button>
            )}
          </div>

          {/* Filter Dropdowns & Category Button */}
          <div
            className="mobile-filter-row"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              flexWrap: 'nowrap',
              overflowX: 'auto',
              scrollbarWidth: 'none',
              width: '100%',
            }}
          >
            {/* Category Dropdown Filter */}
            <div style={{ position: 'relative', flex: '1 1 auto', minWidth: '120px' }}>
              <select
                value={selectedCatId}
                onChange={(e) => setSelectedCatId(e.target.value)}
                style={{
                  width: '100%',
                  height: '38px',
                  padding: '0 28px 0 10px',
                  borderRadius: '10px',
                  border: '1px solid var(--border-color)',
                  backgroundColor: '#FFFFFF',
                  color: '#334155',
                  fontSize: '12.5px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  appearance: 'none',
                  WebkitAppearance: 'none',
                  boxShadow: '0 1px 2px rgba(0, 0, 0, 0.03)',
                }}
              >
                <option value="all">All Categories ({categories.length})</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <Filter size={13} color="#94A3B8" style={{ position: 'absolute', right: '10px', top: '13px', pointerEvents: 'none' }} />
            </div>

            {/* Dietary Dropdown (Veg / Non-Veg) */}
            <div style={{ position: 'relative', flex: '1 1 auto', minWidth: '110px' }}>
              <select
                value={dietaryFilter}
                onChange={(e) => setDietaryFilter(e.target.value as any)}
                style={{
                  width: '100%',
                  height: '38px',
                  padding: '0 28px 0 10px',
                  borderRadius: '10px',
                  border: '1px solid var(--border-color)',
                  backgroundColor: '#FFFFFF',
                  color: '#334155',
                  fontSize: '12.5px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  appearance: 'none',
                  WebkitAppearance: 'none',
                  boxShadow: '0 1px 2px rgba(0, 0, 0, 0.03)',
                }}
              >
                <option value="all">All Food Types</option>
                <option value="veg">Veg Only</option>
                <option value="nonveg">Non-Veg Only</option>
              </select>
              <AlertTriangle size={13} color="#94A3B8" style={{ position: 'absolute', right: '10px', top: '13px', pointerEvents: 'none' }} />
            </div>

            {/* Manage Categories Button */}
            <button
              onClick={() => setCategoryModalOpen(true)}
              style={{
                height: '38px',
                padding: '0 12px',
                borderRadius: '10px',
                backgroundColor: '#FFFFFF',
                border: '1px solid var(--border-color)',
                color: '#334155',
                fontSize: '12.5px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '5px',
                boxShadow: '0 1px 2px rgba(0, 0, 0, 0.03)',
                whiteSpace: 'nowrap',
                flexShrink: 0,
              }}
              title="Manage Categories"
            >
              <Layers size={14} color="#2563EB" />
              <span>Categories</span>
            </button>
          </div>
        </div>

        {/* Data Table */}
        {filteredItems.length === 0 ? (
          /* Empty State Matching Screenshot */
          <div
            style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid var(--border-color)',
              borderRadius: '16px',
              padding: '60px 20px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
            }}
          >
            <svg
              width="74"
              height="74"
              viewBox="0 0 64 64"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              style={{ marginBottom: '16px', opacity: 0.7 }}
            >
              <path
                d="M32 6L54 18V46L32 58L10 46V18L32 6Z"
                stroke="#94A3B8"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M32 58V32"
                stroke="#94A3B8"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M54 18L32 32L10 18"
                stroke="#94A3B8"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>

            <h3 style={{ fontSize: '17px', fontWeight: 800, margin: '0 0 4px 0', color: '#1E293B' }}>
              {currentTab === 'deleted'
                ? 'Trash is empty'
                : currentTab === 'out_of_stock'
                ? 'No out of stock products'
                : 'No products found'}
            </h3>
            <p style={{ fontSize: '13px', color: '#64748B', margin: '0 0 20px 0' }}>
              {currentTab === 'deleted'
                ? 'Deleted products will appear here and can be restored anytime'
                : 'Add a new product or adjust filters to view items'}
            </p>

            {currentTab !== 'deleted' && (
              <button
                onClick={openAddItemModal}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '10px 18px',
                  borderRadius: '10px',
                  backgroundColor: '#1D4ED8',
                  color: '#FFFFFF',
                  fontSize: '13.5px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  border: 'none',
                }}
              >
                <Plus size={15} strokeWidth={2.5} />
                <span>Add Product</span>
              </button>
            )}
          </div>
        ) : (
          /* Products Table */
          <div
            style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid var(--border-color)',
              borderRadius: '16px',
              overflow: 'hidden',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.02)',
            }}
          >
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr
                    style={{
                      backgroundColor: '#F8FAFC',
                      borderBottom: '1px solid var(--border-color)',
                      textAlign: 'left',
                      color: '#475569',
                      fontSize: '11px',
                      fontWeight: 800,
                      letterSpacing: '0.4px',
                    }}
                  >
                    <th style={{ padding: '10px 16px', whiteSpace: 'nowrap' }}>PRODUCT</th>
                    <th style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>SKU</th>
                    <th style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>CATEGORY</th>
                    <th style={{ padding: '10px 14px', textAlign: 'right', whiteSpace: 'nowrap' }}>BASE RATE</th>
                    <th style={{ padding: '10px 14px', textAlign: 'right', whiteSpace: 'nowrap' }}>SELLING</th>
                    <th style={{ padding: '10px 14px', textAlign: 'center', whiteSpace: 'nowrap' }}>STOCK STATUS</th>
                    <th style={{ padding: '10px 14px', textAlign: 'center', whiteSpace: 'nowrap' }}>GST</th>
                    <th style={{ padding: '10px 16px', textAlign: 'right', whiteSpace: 'nowrap' }}>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map((item, idx) => {
                    const cat = categories.find((c) => c.id === item.categoryId);
                    const skuCode = (item.shortName || item.name).slice(0, 4).toUpperCase() + '-' + (idx + 1).toString().padStart(3, '0');
                    const isOutOfStock = item.isOutOfStock || !item.isActive;

                    return (
                      <tr
                        key={item.id}
                        style={{
                          borderBottom: '1px solid #F1F5F9',
                          transition: 'background 0.15s ease',
                          opacity: item.isDeleted ? 0.6 : isOutOfStock ? 0.75 : 1,
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F8FAFC')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                      >
                        {/* PRODUCT Column */}
                        <td style={{ padding: '10px 16px', minWidth: '180px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div
                              style={{
                                width: '13px',
                                height: '13px',
                                border: `1.5px solid ${item.isVeg ? '#10B981' : '#EF4444'}`,
                                padding: '2px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                borderRadius: '3px',
                                flexShrink: 0,
                              }}
                            >
                              <div
                                style={{
                                  width: '5px',
                                  height: '5px',
                                  borderRadius: item.isVeg ? '50%' : '1px',
                                  backgroundColor: item.isVeg ? '#10B981' : '#EF4444',
                                }}
                              />
                            </div>

                            {item.imageUrl ? (
                              <img
                                src={item.imageUrl}
                                alt={item.name}
                                style={{
                                  width: '36px',
                                  height: '36px',
                                  borderRadius: '8px',
                                  objectFit: 'cover',
                                  border: '1px solid var(--border-color)',
                                  flexShrink: 0,
                                }}
                              />
                            ) : (
                              <div
                                style={{
                                  width: '36px',
                                  height: '36px',
                                  borderRadius: '8px',
                                  backgroundColor: '#F1F5F9',
                                  border: '1px solid var(--border-color)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  color: '#94A3B8',
                                  flexShrink: 0,
                                }}
                              >
                                <Package size={16} />
                              </div>
                            )}

                            <div>
                              <div style={{ fontWeight: 800, color: 'var(--text-main)', fontSize: '13px', lineHeight: '1.3' }}>
                                {item.name}
                              </div>
                              <div style={{ fontSize: '11px', color: '#64748B', marginTop: '1px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <span>{item.nameHindi || item.shortName}</span>
                                {item.variants && item.variants.length > 0 && (
                                  <span style={{ color: '#2563EB', fontWeight: 600 }}>
                                    ({item.variants.length} sizes)
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* SKU */}
                        <td style={{ padding: '10px 14px', fontFamily: 'monospace', fontSize: '12px', color: '#64748B', whiteSpace: 'nowrap' }}>
                          {skuCode}
                        </td>

                        {/* CATEGORY */}
                        <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>
                          <span
                            style={{
                              fontSize: '11px',
                              fontWeight: 700,
                              padding: '3px 8px',
                              borderRadius: '6px',
                              backgroundColor: '#F1F5F9',
                              color: '#334155',
                              border: '1px solid #E2E8F0',
                              whiteSpace: 'nowrap',
                              display: 'inline-block',
                            }}
                          >
                            {cat?.name || 'General'}
                          </span>
                        </td>

                        {/* BASE RATE */}
                        <td style={{ padding: '10px 14px', textAlign: 'right', color: '#64748B', whiteSpace: 'nowrap' }}>
                          {formatPaise(item.basePrice, profile.currencySymbol)}
                        </td>

                        {/* SELLING RATE */}
                        <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 800, color: '#0F172A', whiteSpace: 'nowrap' }}>
                          {formatPaise(item.basePrice, profile.currencySymbol)}
                        </td>

                        {/* STOCK STATUS (No background pill, clean text + dot indicator) */}
                        <td style={{ padding: '10px 14px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                          {item.isDeleted ? (
                            <span
                              style={{
                                fontSize: '11px',
                                fontWeight: 800,
                                color: '#DC2626',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              DELETED
                            </span>
                          ) : (
                            <button
                              onClick={() => handleToggleStock(item)}
                              style={{
                                background: 'none',
                                border: 'none',
                                padding: '4px 6px',
                                fontSize: '12px',
                                fontWeight: 700,
                                color: isOutOfStock ? '#DC2626' : '#059669',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                whiteSpace: 'nowrap',
                              }}
                              title="Tap to toggle In Stock / Out of Stock"
                            >
                              <span
                                style={{
                                  width: '7px',
                                  height: '7px',
                                  borderRadius: '50%',
                                  backgroundColor: isOutOfStock ? '#DC2626' : '#10B981',
                                  display: 'inline-block',
                                }}
                              />
                              <span>{isOutOfStock ? 'Out of Stock' : 'In Stock'}</span>
                            </button>
                          )}
                        </td>

                        {/* GST */}
                        <td style={{ padding: '10px 14px', textAlign: 'center', fontSize: '12px', fontWeight: 700, color: '#475569', whiteSpace: 'nowrap' }}>
                          {item.taxPercent}%
                        </td>

                        {/* ACTIONS */}
                        <td style={{ padding: '10px 16px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
                            {item.isDeleted ? (
                              <>
                                <button
                                  onClick={() => handleRestore(item)}
                                  style={{
                                    padding: '5px 10px',
                                    borderRadius: '8px',
                                    backgroundColor: 'rgba(16, 185, 129, 0.12)',
                                    border: '1px solid #10B981',
                                    color: '#10B981',
                                    fontSize: '11.5px',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                  }}
                                  title="Restore product to active menu"
                                >
                                  <RotateCcw size={12} />
                                  <span>Restore</span>
                                </button>
                                <button
                                  onClick={() => handlePermanentDelete(item)}
                                  style={{
                                    padding: '6px',
                                    borderRadius: '8px',
                                    backgroundColor: '#F8FAFC',
                                    border: '1px solid var(--border-color)',
                                    color: '#DC2626',
                                    cursor: 'pointer',
                                  }}
                                  title="Delete Forever"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  onClick={() => openEditItemModal(item)}
                                  style={{
                                    padding: '6px',
                                    borderRadius: '8px',
                                    backgroundColor: '#F8FAFC',
                                    border: '1px solid var(--border-color)',
                                    color: '#2563EB',
                                    cursor: 'pointer',
                                  }}
                                  title="Edit Product Details"
                                >
                                  <Edit2 size={14} />
                                </button>
                                <button
                                  onClick={() => handleSoftDelete(item)}
                                  style={{
                                    padding: '6px',
                                    borderRadius: '8px',
                                    backgroundColor: '#F8FAFC',
                                    border: '1px solid var(--border-color)',
                                    color: '#EF4444',
                                    cursor: 'pointer',
                                  }}
                                  title="Move to Trash"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Product Edit / Add Modal (Pristine, Leak-Proof & Symmetrical) */}
      {editingItem && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.4)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 110,
            padding: '12px',
            boxSizing: 'border-box',
            width: '100vw',
            height: '100vh',
            overflow: 'hidden',
          }}
        >
          <div
            className="animate-slide-up"
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '0px',
              border: '1px solid #CBD5E1',
              maxWidth: '480px',
              width: '100%',
              maxHeight: '92vh',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.35)',
              boxSizing: 'border-box',
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: '14px 16px',
                borderBottom: '1px solid #E2E8F0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: '#FFFFFF',
                flexShrink: 0,
              }}
            >
              <div style={{ minWidth: 0, flex: 1, paddingRight: '8px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0, color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {isNewItem ? 'Add New Product' : `Edit: ${editingItem.name}`}
                </h3>
                <p style={{ fontSize: '11px', color: '#64748B', margin: '2px 0 0 0' }}>
                  Configure pricing, stock status, variants, and photo
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                style={{
                  background: '#F1F5F9',
                  border: '1px solid #CBD5E1',
                  color: '#475569',
                  cursor: 'pointer',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Body */}
            <div
              style={{
                padding: '16px',
                overflowY: 'auto',
                overflowX: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                width: '100%',
                boxSizing: 'border-box',
              }}
            >
              {/* 1. PRODUCT NAME & SHORT NAME (Symmetrical Matched 42px Height) */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', width: '100%', boxSizing: 'border-box' }}>
                <div style={{ minWidth: 0 }}>
                  <label style={{ fontSize: '12px', fontWeight: 800, color: '#334155', display: 'block', marginBottom: '4px' }}>
                    Product Name *
                  </label>
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. Masala Chai"
                    style={{
                      width: '100%',
                      height: '42px',
                      borderRadius: '0px',
                      border: '1px solid #CBD5E1',
                      padding: '0 10px',
                      fontSize: '13px',
                      fontWeight: 600,
                      boxSizing: 'border-box',
                      backgroundColor: '#FFFFFF',
                    }}
                  />
                </div>

                <div style={{ minWidth: 0 }}>
                  <label style={{ fontSize: '12px', fontWeight: 800, color: '#334155', display: 'block', marginBottom: '4px' }}>
                    Short Name (Slip)
                  </label>
                  <input
                    type="text"
                    value={formShortName}
                    onChange={(e) => setFormShortName(e.target.value)}
                    placeholder="e.g. Chai (max 16)"
                    maxLength={16}
                    style={{
                      width: '100%',
                      height: '42px',
                      borderRadius: '0px',
                      border: '1px solid #CBD5E1',
                      padding: '0 10px',
                      fontSize: '13px',
                      fontWeight: 600,
                      boxSizing: 'border-box',
                      backgroundColor: '#FFFFFF',
                    }}
                  />
                </div>
              </div>

              {/* 2. PRODUCT PHOTO (Clean Studio - Upload or URL, No Leaks) */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  padding: '10px',
                  backgroundColor: '#F8FAFC',
                  borderRadius: '0px',
                  border: '1px solid #E2E8F0',
                  width: '100%',
                  boxSizing: 'border-box',
                }}
              >
                {/* Mode Tabs */}
                <div style={{ display: 'flex', gap: '6px', width: '100%', boxSizing: 'border-box' }}>
                  <button
                    type="button"
                    onClick={() => setImageTab('upload')}
                    style={{
                      flex: 1,
                      height: '32px',
                      border: `1px solid ${imageTab === 'upload' ? '#2563EB' : '#CBD5E1'}`,
                      backgroundColor: imageTab === 'upload' ? '#2563EB' : '#FFFFFF',
                      color: imageTab === 'upload' ? '#FFFFFF' : '#475569',
                      fontSize: '11px',
                      fontWeight: 750,
                      cursor: 'pointer',
                      borderRadius: '0px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px',
                    }}
                  >
                    <Camera size={13} />
                    <span>Upload / Camera</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setImageTab('url')}
                    style={{
                      flex: 1,
                      height: '32px',
                      border: `1px solid ${imageTab === 'url' ? '#2563EB' : '#CBD5E1'}`,
                      backgroundColor: imageTab === 'url' ? '#2563EB' : '#FFFFFF',
                      color: imageTab === 'url' ? '#FFFFFF' : '#475569',
                      fontSize: '11px',
                      fontWeight: 750,
                      cursor: 'pointer',
                      borderRadius: '0px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px',
                    }}
                  >
                    <Globe size={13} />
                    <span>Web Link</span>
                  </button>
                </div>

                {/* Photo Input Content */}
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', width: '100%', boxSizing: 'border-box' }}>
                  {/* Photo Thumbnail */}
                  <div style={{ position: 'relative', width: '50px', height: '50px', flexShrink: 0 }}>
                    {formImageUrl ? (
                      <>
                        <img
                          src={formImageUrl}
                          alt="Product Preview"
                          style={{
                            width: '50px',
                            height: '50px',
                            borderRadius: '0px',
                            objectFit: 'cover',
                            border: '1.5px solid #2563EB',
                            display: 'block',
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setFormImageUrl(undefined);
                            setImageLinkInput('');
                          }}
                          style={{
                            position: 'absolute',
                            top: '-5px',
                            right: '-5px',
                            background: '#EF4444',
                            color: '#FFFFFF',
                            border: 'none',
                            borderRadius: '0px',
                            width: '18px',
                            height: '18px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                          }}
                          title="Remove photo"
                        >
                          <X size={11} />
                        </button>
                      </>
                    ) : (
                      <div
                        style={{
                          width: '50px',
                          height: '50px',
                          borderRadius: '0px',
                          border: '1px dashed #CBD5E1',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#94A3B8',
                          backgroundColor: '#FFFFFF',
                        }}
                      >
                        <ImageIcon size={18} />
                      </div>
                    )}
                  </div>

                  {/* Right Action Controls */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {imageTab === 'url' ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', width: '100%' }}>
                        <div style={{ display: 'flex', gap: '4px', width: '100%' }}>
                          <input
                            type="url"
                            placeholder="Paste https://..."
                            value={imageLinkInput}
                            onChange={(e) => {
                              setImageLinkInput(e.target.value);
                              setImageLinkError(null);
                            }}
                            style={{
                              flex: 1,
                              minWidth: 0,
                              height: '38px',
                              fontSize: '12px',
                              borderRadius: '0px',
                              border: `1px solid ${imageLinkError ? '#EF4444' : '#CBD5E1'}`,
                              padding: '0 8px',
                              boxSizing: 'border-box',
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => handleApplyWebImageUrl(false)}
                            disabled={!imageLinkInput.trim()}
                            style={{
                              width: '68px',
                              height: '38px',
                              backgroundColor: '#2563EB',
                              color: '#FFFFFF',
                              fontSize: '11px',
                              fontWeight: 800,
                              border: 'none',
                              borderRadius: '0px',
                              cursor: imageLinkInput.trim() ? 'pointer' : 'not-allowed',
                              opacity: imageLinkInput.trim() ? 1 : 0.6,
                              flexShrink: 0,
                              boxSizing: 'border-box',
                            }}
                          >
                            Apply
                          </button>
                        </div>
                        {imageLinkError && (
                          <div style={{ fontSize: '10px', color: '#EF4444', fontWeight: 600 }}>
                            {imageLinkError}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div style={{ width: '100%' }}>
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          style={{
                            width: '100%',
                            height: '38px',
                            borderRadius: '0px',
                            backgroundColor: '#FFFFFF',
                            border: '1px solid #2563EB',
                            color: '#2563EB',
                            fontSize: '11.5px',
                            fontWeight: 750,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px',
                            boxSizing: 'border-box',
                          }}
                        >
                          <Camera size={13} />
                          <span>{formImageUrl ? 'Replace Photo' : 'Select Photo from Device'}</span>
                        </button>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          style={{ display: 'none' }}
                          onChange={handleImageFileChange}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* 3. STOCK & KITCHEN AVAILABILITY */}
              <div
                style={{
                  padding: '10px',
                  borderRadius: '0px',
                  backgroundColor: formIsOutOfStock ? '#FFFBEB' : '#F0FDF4',
                  border: `1px solid ${formIsOutOfStock ? '#FCD34D' : '#86EFAC'}`,
                  width: '100%',
                  boxSizing: 'border-box',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontSize: '11.5px', fontWeight: 800, color: formIsOutOfStock ? '#92400E' : '#166534' }}>
                    Stock Availability:
                  </span>
                  <span
                    style={{
                      fontSize: '10px',
                      fontWeight: 800,
                      padding: '2px 6px',
                      borderRadius: '0px',
                      backgroundColor: formIsOutOfStock ? '#FEF3C7' : '#DCFCE7',
                      color: formIsOutOfStock ? '#B45309' : '#15803D',
                    }}
                  >
                    {formIsOutOfStock ? 'OUT OF STOCK' : 'IN STOCK'}
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '8px', width: '100%', boxSizing: 'border-box' }}>
                  <button
                    type="button"
                    onClick={() => setFormIsOutOfStock(false)}
                    style={{
                      flex: 1,
                      height: '38px',
                      borderRadius: '0px',
                      border: `1.5px solid ${!formIsOutOfStock ? '#10B981' : '#CBD5E1'}`,
                      backgroundColor: !formIsOutOfStock ? '#10B981' : '#FFFFFF',
                      color: !formIsOutOfStock ? '#FFFFFF' : '#475569',
                      fontWeight: 800,
                      fontSize: '12px',
                      cursor: 'pointer',
                      boxSizing: 'border-box',
                    }}
                  >
                    ● In Stock
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormIsOutOfStock(true)}
                    style={{
                      flex: 1,
                      height: '38px',
                      borderRadius: '0px',
                      border: `1.5px solid ${formIsOutOfStock ? '#F59E0B' : '#CBD5E1'}`,
                      backgroundColor: formIsOutOfStock ? '#F59E0B' : '#FFFFFF',
                      color: formIsOutOfStock ? '#FFFFFF' : '#475569',
                      fontWeight: 800,
                      fontSize: '12px',
                      cursor: 'pointer',
                      boxSizing: 'border-box',
                    }}
                  >
                    ⚠️ Out of Stock
                  </button>
                </div>
              </div>

              {/* 4. CATEGORY & SELLING PRICE (Symmetrical Matched 42px Height) */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', width: '100%', boxSizing: 'border-box' }}>
                <div style={{ minWidth: 0 }}>
                  <label style={{ fontSize: '12px', fontWeight: 800, color: '#334155', display: 'block', marginBottom: '4px' }}>
                    Category *
                  </label>
                  <select
                    value={formCategoryId}
                    onChange={(e) => setFormCategoryId(e.target.value)}
                    style={{
                      width: '100%',
                      height: '42px',
                      borderRadius: '0px',
                      border: '1px solid #CBD5E1',
                      padding: '0 8px',
                      fontSize: '13px',
                      fontWeight: 600,
                      backgroundColor: '#FFFFFF',
                      boxSizing: 'border-box',
                    }}
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ minWidth: 0 }}>
                  <label style={{ fontSize: '12px', fontWeight: 800, color: '#334155', display: 'block', marginBottom: '4px' }}>
                    Selling Price ({profile.currencySymbol}) *
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={formPriceRupees}
                    onChange={(e) => setFormPriceRupees(e.target.value)}
                    placeholder="0.00"
                    style={{
                      width: '100%',
                      height: '42px',
                      borderRadius: '0px',
                      border: '1px solid #CBD5E1',
                      padding: '0 10px',
                      fontSize: '13px',
                      fontWeight: 700,
                      boxSizing: 'border-box',
                      backgroundColor: '#FFFFFF',
                    }}
                  />
                </div>
              </div>

              {/* 5. DIETARY & GST TAX RATE (Symmetrical Matched 42px Height) */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', width: '100%', boxSizing: 'border-box' }}>
                <div style={{ minWidth: 0 }}>
                  <label style={{ fontSize: '12px', fontWeight: 800, color: '#334155', display: 'block', marginBottom: '4px' }}>
                    Dietary Type
                  </label>
                  <div style={{ display: 'flex', gap: '4px', height: '42px', width: '100%', boxSizing: 'border-box' }}>
                    <button
                      type="button"
                      onClick={() => setFormIsVeg(true)}
                      style={{
                        flex: 1,
                        height: '42px',
                        borderRadius: '0px',
                        border: `1.5px solid ${formIsVeg ? '#10B981' : '#CBD5E1'}`,
                        backgroundColor: formIsVeg ? '#ECFDF5' : '#FFFFFF',
                        color: formIsVeg ? '#059669' : '#64748B',
                        fontWeight: 800,
                        fontSize: '12px',
                        cursor: 'pointer',
                        boxSizing: 'border-box',
                      }}
                    >
                      VEG
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormIsVeg(false)}
                      style={{
                        flex: 1,
                        height: '42px',
                        borderRadius: '0px',
                        border: `1.5px solid ${!formIsVeg ? '#EF4444' : '#CBD5E1'}`,
                        backgroundColor: !formIsVeg ? '#FEF2F2' : '#FFFFFF',
                        color: !formIsVeg ? '#DC2626' : '#64748B',
                        fontWeight: 800,
                        fontSize: '12px',
                        cursor: 'pointer',
                        boxSizing: 'border-box',
                      }}
                    >
                      NON-VEG
                    </button>
                  </div>
                </div>

                <div style={{ minWidth: 0 }}>
                  <label style={{ fontSize: '12px', fontWeight: 800, color: '#334155', display: 'block', marginBottom: '4px' }}>
                    GST Tax Rate (%)
                  </label>
                  <select
                    value={formTaxPercent}
                    onChange={(e) => setFormTaxPercent(Number(e.target.value))}
                    style={{
                      width: '100%',
                      height: '42px',
                      borderRadius: '0px',
                      border: '1px solid #CBD5E1',
                      padding: '0 8px',
                      fontSize: '13px',
                      fontWeight: 600,
                      backgroundColor: '#FFFFFF',
                      boxSizing: 'border-box',
                    }}
                  >
                    <option value={0}>0% (Tax Exempt)</option>
                    <option value={5}>5% (Standard)</option>
                    <option value={12}>12% GST</option>
                    <option value={18}>18% GST</option>
                  </select>
                </div>
              </div>

              {/* 6. Multiple Sizes / Variants */}
              <div style={{ width: '100%', boxSizing: 'border-box' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#475569', margin: 0 }}>
                    Portion Sizes / Variants (Optional)
                  </label>
                  <button
                    type="button"
                    onClick={handleAddVariantRow}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#2563EB',
                      fontSize: '11.5px',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    + Add Size
                  </button>
                </div>

                {formVariants.map((v, vIdx) => (
                  <div key={v.id || vIdx} style={{ display: 'flex', gap: '6px', marginBottom: '6px', width: '100%', boxSizing: 'border-box' }}>
                    <input
                      type="text"
                      placeholder="Size (e.g. Half, Full)"
                      value={v.label}
                      onChange={(e) => handleUpdateVariant(vIdx, 'label', e.target.value)}
                      style={{ flex: 1, minWidth: 0, height: '38px', fontSize: '12.5px', boxSizing: 'border-box' }}
                    />
                    <input
                      type="number"
                      placeholder="Price (₹)"
                      value={v.price / 100}
                      onChange={(e) => handleUpdateVariant(vIdx, 'price', rupeesToPaise(e.target.value))}
                      style={{ width: '90px', height: '38px', fontSize: '12.5px', boxSizing: 'border-box' }}
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveVariant(vIdx)}
                      style={{
                        background: '#FEE2E2',
                        border: '1px solid #FECACA',
                        color: '#DC2626',
                        cursor: 'pointer',
                        width: '38px',
                        height: '38px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        boxSizing: 'border-box',
                      }}
                    >
                      <X size={15} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Modal Footer */}
            <div
              style={{
                padding: '12px 16px',
                borderTop: '1px solid #E2E8F0',
                display: 'flex',
                gap: '8px',
                justifyContent: 'flex-end',
                backgroundColor: '#FFFFFF',
                flexShrink: 0,
              }}
            >
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                style={{
                  padding: '9px 16px',
                  borderRadius: '0px',
                  backgroundColor: '#F8FAFC',
                  border: '1px solid #CBD5E1',
                  color: '#475569',
                  fontWeight: 700,
                  fontSize: '13px',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveItem}
                style={{
                  padding: '9px 20px',
                  borderRadius: '0px',
                  backgroundColor: '#1D4ED8',
                  color: '#FFFFFF',
                  fontWeight: 800,
                  fontSize: '13px',
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(29, 78, 216, 0.25)',
                }}
              >
                Save Product
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Cropper Modal */}
      {cropperOpen && (
        <ImageCropperModal
          isOpen={cropperOpen}
          imageSrc={cropImageSrc}
          title="Crop Dish Photo (1:1 Square)"
          aspectRatio={1}
          isCircle={false}
          onCropComplete={(croppedBase64) => {
            setFormImageUrl(croppedBase64);
            setCropperOpen(false);
          }}
          onClose={() => setCropperOpen(false)}
        />
      )}

      {/* Categories Management Modal */}
      {categoryModalOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.4)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 115,
            padding: '16px',
          }}
        >
          <div
            className="animate-slide-up"
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '24px',
              border: '1px solid var(--border-color)',
              maxWidth: '460px',
              width: '100%',
              padding: '22px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '17px', fontWeight: 800, margin: 0, color: '#0F172A' }}>
                Product Categories ({categories.length})
              </h3>
              <button
                onClick={() => setCategoryModalOpen(false)}
                style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ maxHeight: '240px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '16px' }}>
              {categories.map((c) => (
                <div
                  key={c.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    backgroundColor: '#F8FAFC',
                    border: '1px solid #E2E8F0',
                  }}
                >
                  <span style={{ fontWeight: 700, fontSize: '13px', color: '#1E293B' }}>{c.name}</span>
                  <button
                    onClick={async () => {
                      if (categories.length <= 1) {
                        customAlert('You must keep at least 1 category.', 'Cannot Delete', 'warning');
                        return;
                      }
                      await db.categories.delete(c.id);
                      onRefreshData();
                    }}
                    style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', padding: '4px' }}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                placeholder="New Category Name..."
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                style={{ flex: 1 }}
              />
              <button
                onClick={async () => {
                  if (!newCatName.trim()) return;
                  await db.categories.add({
                    id: `cat_${Date.now()}`,
                    name: newCatName.trim(),
                    sortOrder: categories.length + 1,
                    isActive: true,
                  });
                  setNewCatName('');
                  onRefreshData();
                }}
                style={{
                  padding: '0 16px',
                  borderRadius: '10px',
                  backgroundColor: '#1D4ED8',
                  color: '#FFFFFF',
                  fontWeight: 700,
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Cropper Modal for 1:1 square crop of product photos */}
      {cropperOpen && (
        <ImageCropperModal
          isOpen={cropperOpen}
          imageSrc={cropImageSrc}
          title="Crop Product Photo (1:1)"
          aspectRatio={1}
          isCircle={false}
          onCropComplete={handleCropComplete}
          onClose={() => setCropperOpen(false)}
        />
      )}

      {/* Export Catalogue Modal (Excel, PDF, JSON) */}
      {exportModalOpen && (
        <ExportModal
          isOpen={exportModalOpen}
          onClose={() => setExportModalOpen(false)}
          title="Export Menu & Catalogue"
          subtitle="Download or share your product catalogue with full pricing & taxes"
          itemCountDescription={`${items.length} Products • ${categories.length} Categories`}
          excelDescription="Full inventory spreadsheet with categories, prices, taxes, stock quantities & variants for Excel & Sheets."
          pdfDescription="Beautifully formatted printable menu catalogue with restaurant branding, veg/non-veg tags & prices."
          jsonDescription="Complete catalogue package with categories, products, prices, variants & full photos. Importable into any device with 1 click."
          onExportExcel={async () => {
            const res = await exportMenuToExcel(items, categories, profile.name);
            if (!res.success) {
              throw new Error(res.error || 'Excel export failed');
            }
          }}
          onExportPdf={async () => {
            const res = await exportMenuToPdf(items, categories, profile);
            if (!res.success) {
              throw new Error(res.error || 'PDF export failed');
            }
          }}
          onExportJson={async () => {
            const cataloguePayload = {
              app: 'BillingPro',
              type: 'MENU_CATALOGUE',
              version: 1,
              exportedAt: Date.now(),
              restaurantName: profile.name,
              itemCount: items.length,
              categoryCount: categories.length,
              categories,
              items,
            };
            const jsonBlob = new Blob([JSON.stringify(cataloguePayload, null, 2)], { type: 'application/json' });
            const cleanName = profile.name.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
            const fileName = `menu_catalogue_${cleanName}_${new Date().toISOString().slice(0, 10)}.json`;
            const res = await saveAndShareFile({
              blob: jsonBlob,
              filename: fileName,
              mimeType: 'application/json',
              title: `${profile.name} Complete Menu Backup`,
              dialogTitle: `Save or Share ${fileName}`,
            });
            if (!res.success) {
              throw new Error(res.error || 'JSON export failed');
            }
          }}
        />
      )}
    </div>
  );
};
