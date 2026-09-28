import {
  BadgeCheck,
  Boxes,
  ImagePlus,
  LoaderCircle,
  Pencil,
  Plus,
  ShieldAlert,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";

import { ErrorState, LoadingState } from "@/components/feedback-states";
import { NafdacVerifiedBadge } from "@/components/marketplace/nafdac-verified-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  useCreateInventory,
  useInventory,
  useUpdateInventory,
  useUploadProductImage,
  useVerifyNafdac,
} from "@/hooks/use-pharmacy-workspace";
import { formatNaira } from "@/lib/format";
import type {
  InventoryItem,
  NafdacVerificationResult,
  ProductCreateInput,
} from "@/types/pharmacy";

const emptyProduct: ProductCreateInput = {
  name: "",
  strength: "",
  sku: "",
  category: "",
  nafdacNumber: "",
  imageUrl: "",
  stockCount: 0,
  reorderLevel: 5,
  unitPrice: 0,
  requiresPrescription: false,
  requiresPharmacistReview: false,
  preorderSupported: false,
};

function AddInventoryForm({ onClose }: { onClose: () => void }) {
  const create = useCreateInventory();
  const verifyNafdac = useVerifyNafdac();
  const uploadImage = useUploadProductImage();
  const [product, setProduct] = useState<ProductCreateInput>(emptyProduct);
  const [verification, setVerification] =
    useState<NafdacVerificationResult | null>(null);

  const set = <K extends keyof ProductCreateInput>(
    key: K,
    value: ProductCreateInput[K],
  ) => {
    if (key === "name" || key === "nafdacNumber") setVerification(null);
    setProduct((current) => ({ ...current, [key]: value }));
  };

  const verify = async () => {
    const result = await verifyNafdac.mutateAsync({
      nafdacNumber: product.nafdacNumber,
      productName: product.name,
      strength: product.strength,
    });
    setVerification(result);
    if (result.verified) {
      setProduct((current) => ({
        ...current,
        name: result.officialName,
        strength: result.strength || current.strength,
        packSize: result.packSize || current.packSize,
        description:
          result.description || result.composition || current.description,
        genericName: result.ingredient || current.genericName,
        brand: result.manufacturer || current.brand,
        nafdacNumber: result.nafdacNumber,
      }));
    }
  };

  const save = async () => {
    await create.mutateAsync(product);
    setProduct(emptyProduct);
    setVerification(null);
    onClose();
  };

  const selectImage = async (file?: File) => {
    if (!file) return;
    const result = await uploadImage.mutateAsync(file);
    set("imageUrl", result.imageUrl);
  };

  const canVerify =
    product.name.trim().length >= 2 && product.nafdacNumber.trim().length >= 3;
  const canSave = Boolean(
    verification?.verified &&
    product.name &&
    product.sku &&
    product.category &&
    product.imageUrl &&
    product.unitPrice > 0,
  );

  return (
    <section className="rounded-3xl border bg-card p-5 shadow-sm sm:p-7">
      <div>
        <h2 className="text-xl font-bold">Add catalogue product</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Verify the registered product with NAFDAC before adding stock to the
          marketplace.
        </p>
      </div>

      <div className="mt-5 rounded-2xl border border-blue-200 bg-blue-50 p-4">
        <div className="flex items-start gap-3">
          <ShieldAlert className="mt-0.5 size-5 shrink-0 text-blue-800" />
          <div>
            <h3 className="font-bold text-blue-950">
              NAFDAC product verification
            </h3>
            <p className="mt-1 text-sm leading-6 text-blue-900">
              Enter the product name exactly as registered and its NAFDAC
              number. DrugSpot checks the live NAFDAC Greenbook before saving.
            </p>
          </div>
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-[1fr_1fr_auto] md:items-end">
          <label className="text-xs font-semibold">
            Product name
            <Input
              className="mt-2 bg-white"
              value={product.name}
              onChange={(event) => set("name", event.target.value)}
              placeholder="e.g. AC-Drex Tablet"
            />
          </label>
          <label className="text-xs font-semibold">
            NAFDAC number
            <Input
              className="mt-2 bg-white uppercase"
              value={product.nafdacNumber}
              onChange={(event) =>
                set("nafdacNumber", event.target.value.toUpperCase())
              }
              placeholder="e.g. A11-0551"
            />
          </label>
          <Button
            type="button"
            disabled={!canVerify || verifyNafdac.isPending}
            onClick={() => void verify()}
          >
            {verifyNafdac.isPending ? (
              <LoaderCircle className="animate-spin" />
            ) : (
              <BadgeCheck />
            )}
            {verifyNafdac.isPending ? "Checking…" : "Verify with NAFDAC"}
          </Button>
        </div>
        {verification && (
          <div
            className={`mt-4 rounded-xl p-4 text-sm ${verification.verified ? "bg-emerald-100 text-emerald-950" : "bg-red-100 text-red-900"}`}
          >
            <div className="flex flex-wrap items-center gap-2">
              {verification.verified && <NafdacVerifiedBadge />}
              <strong>{verification.reason}</strong>
            </div>
            {verification.officialName && (
              <p className="mt-2 leading-6">
                <strong>Registered product:</strong> {verification.officialName}
                {verification.strength ? ` · ${verification.strength}` : ""}
                {verification.manufacturer
                  ? ` · ${verification.manufacturer}`
                  : ""}
                {verification.expiryDate
                  ? ` · Valid until ${verification.expiryDate}`
                  : ""}
              </p>
            )}
          </div>
        )}
        {verifyNafdac.error && (
          <p className="mt-3 text-sm font-medium text-red-700">
            {verifyNafdac.error.message}
          </p>
        )}
      </div>

      <div className="mt-5 rounded-2xl border p-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          {product.imageUrl ? (
            <div className="relative size-36 shrink-0 overflow-hidden rounded-2xl border bg-white">
              <img
                src={product.imageUrl}
                alt="Uploaded product preview"
                className="size-full object-contain p-2"
              />
              <button
                type="button"
                aria-label="Remove product image"
                onClick={() => set("imageUrl", "")}
                className="absolute right-2 top-2 grid size-8 place-items-center rounded-full bg-slate-950/75 text-white"
              >
                <X className="size-4" />
              </button>
            </div>
          ) : (
            <div className="grid size-36 shrink-0 place-items-center rounded-2xl border border-dashed bg-slate-50 text-slate-400">
              <ImagePlus className="size-9" />
            </div>
          )}
          <div className="flex-1">
            <h3 className="font-bold">Clear product photo</h3>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              Upload the front of the medicine pack so customers can recognise
              what they are buying. This photo is a visual reference and is not
              used as proof of authenticity.
            </p>
            <label className="mt-3 inline-flex cursor-pointer items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
              {uploadImage.isPending ? (
                <LoaderCircle className="size-4 animate-spin" />
              ) : (
                <ImagePlus className="size-4" />
              )}
              {uploadImage.isPending
                ? "Uploading…"
                : product.imageUrl
                  ? "Replace image"
                  : "Choose image"}
              <input
                className="sr-only"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                disabled={uploadImage.isPending}
                onChange={(event) => void selectImage(event.target.files?.[0])}
              />
            </label>
            <p className="mt-2 text-xs text-muted-foreground">
              JPEG, PNG or WebP · maximum 5 MB
            </p>
            {uploadImage.error && (
              <p className="mt-2 text-sm font-medium text-red-700">
                {uploadImage.error.message}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <label className="text-xs font-semibold">
          Strength
          <Input
            className="mt-2"
            value={product.strength}
            onChange={(event) => set("strength", event.target.value)}
            placeholder="e.g. 500 mg"
          />
        </label>
        <label className="text-xs font-semibold">
          SKU
          <Input
            className="mt-2"
            value={product.sku}
            onChange={(event) => set("sku", event.target.value)}
          />
        </label>
        <label className="text-xs font-semibold">
          Category
          <Input
            className="mt-2"
            value={product.category}
            onChange={(event) => set("category", event.target.value)}
          />
        </label>
        <label className="text-xs font-semibold">
          Stock
          <Input
            className="mt-2"
            type="number"
            min="0"
            value={product.stockCount}
            onChange={(event) => set("stockCount", Number(event.target.value))}
          />
        </label>
        <label className="text-xs font-semibold">
          Reorder level
          <Input
            className="mt-2"
            type="number"
            min="0"
            value={product.reorderLevel}
            onChange={(event) =>
              set("reorderLevel", Number(event.target.value))
            }
          />
        </label>
        <label className="text-xs font-semibold">
          Price (NGN)
          <Input
            className="mt-2"
            type="number"
            min="1"
            value={product.unitPrice}
            onChange={(event) => set("unitPrice", Number(event.target.value))}
          />
        </label>
      </div>
      <div className="mt-5 flex flex-wrap gap-5 text-sm font-medium">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={product.requiresPrescription}
            onChange={(event) =>
              set("requiresPrescription", event.target.checked)
            }
          />
          Prescription required
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={product.preorderSupported}
            onChange={(event) => set("preorderSupported", event.target.checked)}
          />
          Allow pre-orders
        </label>
      </div>
      {create.error && (
        <p className="mt-4 text-sm text-red-700">{create.error.message}</p>
      )}
      <div className="mt-5 flex gap-2">
        <Button
          disabled={create.isPending || !canSave}
          onClick={() => void save()}
        >
          {create.isPending && <LoaderCircle className="animate-spin" />}Save
          verified product
        </Button>
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
      </div>
    </section>
  );
}

function InventoryRow({ item }: { item: InventoryItem }) {
  const update = useUpdateInventory();
  const [editing, setEditing] = useState(false);
  const [stock, setStock] = useState(String(item.stockCount));
  const [level, setLevel] = useState(String(item.reorderLevel));
  const [price, setPrice] = useState(String(item.unitPrice));
  const save = async () => {
    await update.mutateAsync({
      id: item.id,
      input: {
        stockCount: Number(stock),
        reorderLevel: Number(level),
        unitPrice: Number(price),
      },
    });
    setEditing(false);
  };
  return (
    <article className="rounded-2xl border bg-card p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        {item.imageUrl && (
          <img
            src={item.imageUrl}
            alt={`${item.productName} package`}
            className="size-20 shrink-0 rounded-xl border bg-white object-contain p-1"
            loading="lazy"
          />
        )}
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-bold">
              {item.productName} {item.strength}
            </h2>
            <Badge
              className={
                item.status === "in_stock"
                  ? "bg-emerald-100 text-emerald-800"
                  : item.status === "low_stock"
                    ? "bg-amber-100 text-amber-900"
                    : "bg-red-100 text-red-800"
              }
            >
              {item.status.replaceAll("_", " ")}
            </Badge>
            {item.nafdacVerified && <NafdacVerifiedBadge />}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {item.sku} · {item.category}
            {item.requiresPrescription ? " · Prescription" : ""}
          </p>
          {item.nafdacNumber && (
            <p className="mt-1 text-xs font-medium text-emerald-700">
              NAFDAC {item.nafdacNumber}
              {item.nafdacManufacturer ? ` · ${item.nafdacManufacturer}` : ""}
            </p>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          aria-label={`Edit ${item.productName}`}
          onClick={() => setEditing(!editing)}
        >
          <Pencil />
        </Button>
      </div>
      {editing ? (
        <div className="mt-5 grid gap-4 border-t pt-4 sm:grid-cols-3">
          <label className="text-xs font-semibold">
            Stock
            <Input
              type="number"
              min="0"
              className="mt-2"
              value={stock}
              onChange={(event) => setStock(event.target.value)}
            />
          </label>
          <label className="text-xs font-semibold">
            Reorder level
            <Input
              type="number"
              min="0"
              className="mt-2"
              value={level}
              onChange={(event) => setLevel(event.target.value)}
            />
          </label>
          <label className="text-xs font-semibold">
            Price (NGN)
            <Input
              type="number"
              min="0"
              className="mt-2"
              value={price}
              onChange={(event) => setPrice(event.target.value)}
            />
          </label>
          <div className="flex gap-2 sm:col-span-3">
            <Button onClick={() => void save()} disabled={update.isPending}>
              Save changes
            </Button>
            <Button variant="outline" onClick={() => setEditing(false)}>
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <div className="mt-5 grid grid-cols-3 gap-3 border-t pt-4 text-sm">
          <div>
            <p className="text-xs text-muted-foreground">Stock</p>
            <p className="mt-1 font-bold">{item.stockCount}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Reorder at</p>
            <p className="mt-1 font-bold">{item.reorderLevel}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Price</p>
            <p className="mt-1 font-bold">{formatNaira(item.unitPrice)}</p>
          </div>
        </div>
      )}
    </article>
  );
}

export function InventoryPage() {
  const { data = [], isLoading, error, refetch } = useInventory();
  const [search, setSearch] = useState("");
  const [adding, setAdding] = useState(false);
  const filtered = useMemo(
    () =>
      data.filter((item) =>
        `${item.productName} ${item.sku} ${item.category} ${item.nafdacNumber ?? ""}`
          .toLowerCase()
          .includes(search.toLowerCase()),
      ),
    [data, search],
  );
  if (isLoading) return <LoadingState label="Loading inventory…" />;
  if (error)
    return (
      <ErrorState
        message="We could not load inventory."
        onRetry={() => void refetch()}
      />
    );
  return (
    <div className="space-y-6">
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold text-primary">Stock control</p>
          <h1 className="mt-1 text-3xl font-bold">Inventory</h1>
          <p className="mt-2 text-muted-foreground">
            Add NAFDAC-verified products and update stock, reorder levels, and
            marketplace prices.
          </p>
        </div>
        <div className="flex gap-2">
          <div className="flex items-center gap-2 rounded-xl bg-secondary px-4 py-3 text-sm font-semibold text-primary">
            <Boxes />
            {data.length} products
          </div>
          <Button onClick={() => setAdding(true)}>
            <Plus />
            Add product
          </Button>
        </div>
      </section>
      {adding && <AddInventoryForm onClose={() => setAdding(false)} />}
      <label className="relative block">
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search product, SKU, category, or NAFDAC number"
        />
      </label>
      <section className="grid gap-4 xl:grid-cols-2">
        {filtered.map((item) => (
          <InventoryRow key={item.id} item={item} />
        ))}
      </section>
      {!filtered.length && (
        <p className="rounded-2xl border border-dashed p-10 text-center text-muted-foreground">
          No products yet. Add the pharmacy&apos;s first NAFDAC-verified
          catalogue item.
        </p>
      )}
    </div>
  );
}
