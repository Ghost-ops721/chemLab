"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { getAllEquipment, getAllItems } from "@/domains/registry";
import { getChemical } from "@/domains/chemistry/data/chemicals";
import { EQUIPMENT_BY_ID } from "@/domains/chemistry/data/equipment";
import { DraggableItem } from "@/drag/DraggableItem";
import { useDeskStore } from "@/store/deskStore";
import { showToast } from "@/gamification/ToastHost";
import { useGoalStore } from "@/store/goalStore";
import { getGoal } from "@/domains/chemistry/data/goals";
import { useAuthStore } from "@/store/authStore";
import { labCopy } from "@/lab/labCopy";

type ModalKind = "equipment" | "chemicals" | null;

export function ItemPanel() {
  const [modal, setModal] = useState<ModalKind>(null);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [mounted] = useState(() => typeof window !== "undefined");

  const vessels = useDeskStore((s) => s.vessels);
  const activeVesselId = useDeskStore((s) => s.activeVesselId);
  const placeEquipment = useDeskStore((s) => s.placeEquipment);
  const addChemicalToVessel = useDeskStore((s) => s.addChemicalToVessel);
  const attachHeat = useDeskStore((s) => s.attachHeat);
  const stirVessel = useDeskStore((s) => s.stirVessel);

  const activeGoalId = useGoalStore((s) => s.activeGoalId);
  const goal = activeGoalId ? getGoal(activeGoalId) : undefined;
  const highlightIds = useMemo(
    () => new Set(goal?.highlightItemIds ?? []),
    [goal],
  );

  const items = getAllItems("chemistry");
  const equipment = getAllEquipment("chemistry");

  useEffect(() => {
    if (!modal) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setModal(null);
    }
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [modal]);

  function openModal(kind: Exclude<ModalKind, null>) {
    setQuery("");
    setCategory("all");
    setModal(kind);
  }

  const categories = useMemo(() => {
    const set = new Set(items.map((i) => i.category));
    return ["all", ...Array.from(set).sort()];
  }, [items]);

  const filteredChemicals = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((i) => {
      if (category !== "all" && i.category !== category) return false;
      if (!q) return true;
      const chem = getChemical(i.id);
      const hay =
        `${i.name} ${chem?.formula ?? ""} ${i.category} ${i.subcategory}`.toLowerCase();
      return hay.includes(q);
    });
  }, [items, query, category]);

  const filteredEquipment = useMemo(() => {
    const q = query.trim().toLowerCase();
    return equipment.filter((i) => {
      if (!q) return true;
      return `${i.name} ${i.subcategory}`.toLowerCase().includes(q);
    });
  }, [equipment, query]);

  const targetVessel =
    vessels.find((v) => v.instanceId === activeVesselId) ?? vessels[0];

  function quickChemical(id: string) {
    if (!targetVessel) {
      showToast({
        title: "Need glassware first",
        detail: "Place a beaker, then tap + to pour.",
      });
      setModal("equipment");
      return;
    }
    const beforeBlocked = useAuthStore.getState().isLabBlocked();
    const ok = addChemicalToVessel(targetVessel.instanceId, id);
    if (!ok) {
      showToast(
        beforeBlocked || useAuthStore.getState().isLabBlocked()
          ? labCopy.signUpToPour
          : labCopy.pourFail,
      );
      return;
    }
    const chem = getChemical(id);
    showToast(labCopy.pourOk(chem?.formula ?? id));
    setModal(null);
  }

  function quickEquipment(id: string) {
    const eq = EQUIPMENT_BY_ID[id];
    if (!eq) return;
    if (eq.function === "heat-source") {
      if (!targetVessel) {
        showToast({
          title: "Place a vessel first",
          detail: "Then light the burner under it.",
        });
        return;
      }
      attachHeat(targetVessel.instanceId);
      showToast(labCopy.burnerOn);
      setModal(null);
      return;
    }
    if (eq.function === "stirring") {
      if (!targetVessel) {
        showToast({
          title: "Place a vessel first",
          detail: "Then stir its contents.",
        });
        return;
      }
      stirVessel(targetVessel.instanceId, true);
      setModal(null);
      return;
    }
    const n = vessels.length;
    placeEquipment(id, {
      x: 48 + (n % 4) * 190,
      y: 48 + Math.floor(n / 4) * 210,
    });
    setModal(null);
  }

  const list =
    modal === "chemicals" ? filteredChemicals : filteredEquipment;

  const modalUi =
    mounted && modal
      ? createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="inventory-modal-title"
            className="fixed inset-0 z-[300] flex h-dvh w-screen flex-col"
            style={{
              background:
                "radial-gradient(ellipse at 12% 0%, rgba(143, 192, 181, 0.22), transparent 42%), radial-gradient(ellipse at 88% 100%, rgba(196, 120, 58, 0.08), transparent 40%), var(--lab-wash)",
            }}
          >
            <header className="shrink-0 border-b border-lab-line/50 bg-lab-panel/90 px-3 py-1.5 backdrop-blur-md sm:px-4">
              <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-baseline gap-2">
                    <p className="font-display text-[9px] uppercase tracking-[0.18em] text-lab-teal">
                      Inventory
                    </p>
                    <h2
                      id="inventory-modal-title"
                      className="font-display text-lg leading-none tracking-tight text-lab-ink"
                    >
                      {modal === "equipment" ? "Equipment" : "Chemicals"}
                    </h2>
                  </div>
                  <p className="mt-0.5 max-w-xl truncate text-[11px] text-lab-muted">
                    {modal === "equipment"
                      ? "Place glassware on the desk, or use heat and stir on the active vessel."
                      : targetVessel
                        ? `Pour into ${EQUIPMENT_BY_ID[targetVessel.equipmentId]?.name ?? "vessel"}${
                            targetVessel.contentIds.length
                              ? ` · ${targetVessel.contentIds.length} inside`
                              : ""
                          }.`
                        : "Place glassware first, then pour reactants into it."}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setModal(null)}
                  className="shrink-0 rounded-md bg-lab-ink px-2.5 py-1 text-[11px] font-medium text-lab-foam transition hover:bg-lab-teal"
                >
                  Done
                </button>
              </div>
            </header>

            <div className="shrink-0 border-b border-lab-line/40 bg-lab-panel/55 px-3 py-1.5 sm:px-4">
              <div className="mx-auto w-full max-w-5xl space-y-1.5">
                <label className="relative block">
                  <span className="sr-only">Search</span>
                  <input
                    autoFocus
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={
                      modal === "equipment"
                        ? "Search glassware, heat, tools…"
                        : "Search by name or formula — HCl, NaOH, ethanol…"
                    }
                    className="w-full rounded-lg border border-lab-line/70 bg-white px-2.5 py-1.5 text-xs text-lab-ink outline-none ring-lab-teal/30 placeholder:text-lab-muted focus:ring-2"
                  />
                </label>

                {modal === "chemicals" ? (
                  <div className="flex gap-1 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    {categories.map((c) => {
                      const active = category === c;
                      return (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setCategory(c)}
                          className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium capitalize transition ${
                            active
                              ? "bg-lab-teal text-lab-foam"
                              : "bg-white/80 text-lab-muted ring-1 ring-lab-line/60 hover:text-lab-ink"
                          }`}
                        >
                          {c === "all" ? "All" : c}
                        </button>
                      );
                    })}
                  </div>
                ) : null}
              </div>
            </div>

            <div className="scroll-thin min-h-0 flex-1 overflow-y-auto px-3 py-2 sm:px-4">
              <div className="mx-auto w-full max-w-5xl">
                <p className="mb-1.5 text-[10px] text-lab-muted">
                  {list.length}{" "}
                  {modal === "equipment" ? "tools" : "chemicals"}
                  {query.trim() ? ` matching “${query.trim()}”` : ""}
                </p>

                {list.length === 0 ? (
                  <p className="rounded-lg border border-dashed border-lab-line/70 bg-white/40 px-3 py-6 text-center text-[11px] text-lab-muted">
                    Nothing matched. Try another formula or clear the search.
                  </p>
                ) : modal === "chemicals" ? (
                  <div className="grid grid-cols-1 gap-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {filteredChemicals.map((item) => {
                      const chem = getChemical(item.id);
                      const highlighted = highlightIds.has(item.id);
                      return (
                        <div
                          key={item.id}
                          className={`group flex items-stretch overflow-hidden rounded-lg border bg-white/90 shadow-sm transition hover:border-lab-teal/40 hover:shadow-md ${
                            highlighted
                              ? "border-lab-amber/55 ring-1 ring-lab-amber/20"
                              : "border-lab-line/55"
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => quickChemical(item.id)}
                            className="flex min-w-0 flex-1 items-center gap-1.5 px-2 py-1 text-left"
                          >
                            <span
                              className="relative flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-lab-wash text-sm"
                              aria-hidden
                            >
                              {item.icon}
                              {chem?.color ? (
                                <span
                                  className="absolute bottom-0 right-0 h-1.5 w-1.5 rounded-full ring-1 ring-white"
                                  style={{ background: chem.color }}
                                />
                              ) : null}
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block truncate font-mono text-xs font-semibold tracking-tight text-lab-ink">
                                {chem?.formula ?? item.name}
                              </span>
                              <span className="block truncate text-[10px] leading-tight text-lab-muted">
                                {item.name}
                              </span>
                            </span>
                          </button>
                          <button
                            type="button"
                            title="Pour into active vessel"
                            onClick={() => quickChemical(item.id)}
                            className="shrink-0 border-l border-lab-line/40 px-2 text-xs font-bold text-lab-teal transition hover:bg-lab-teal hover:text-white"
                          >
                            +
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {filteredEquipment.map((item) => {
                      const highlighted = highlightIds.has(item.id);
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => quickEquipment(item.id)}
                          className={`flex items-center gap-2 rounded-lg border bg-white/90 px-2 py-1.5 text-left shadow-sm transition hover:border-lab-teal/45 hover:shadow-md ${
                            highlighted
                              ? "border-lab-amber/55 ring-1 ring-lab-amber/20"
                              : "border-lab-line/55"
                          }`}
                        >
                          <span
                            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-lab-wash text-base"
                            aria-hidden
                          >
                            {item.icon}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-xs font-medium leading-tight text-lab-ink">
                              {item.name}
                            </span>
                            <span className="block truncate text-[10px] capitalize leading-tight text-lab-muted">
                              {item.subcategory}
                            </span>
                          </span>
                          <span className="shrink-0 rounded-md bg-lab-teal/10 px-1.5 py-0.5 text-[11px] font-semibold text-lab-teal">
                            +
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      {/* Mobile inventory FAB — above tool dock / toasts */}
      <div className="pointer-events-none absolute bottom-16 right-3 z-40 flex flex-col gap-1.5 md:hidden">
        <button
          type="button"
          onClick={() => openModal("chemicals")}
          className="pointer-events-auto rounded-full bg-lab-teal px-3 py-2 text-[11px] font-semibold text-white shadow-lg"
        >
          Chemicals
        </button>
        <button
          type="button"
          onClick={() => openModal("equipment")}
          className="pointer-events-auto rounded-full border border-lab-line bg-lab-panel px-3 py-2 text-[11px] font-semibold text-lab-ink shadow-lg"
        >
          Equipment
        </button>
      </div>

    <aside className="panel-glass hidden w-full shrink-0 flex-col border-b border-lab-line/60 md:flex md:h-full md:max-h-none md:w-[14rem] md:border-b-0 md:border-r xl:w-[15.5rem]">
      <div className="border-b border-lab-line/50 px-2.5 pb-2 pt-2.5">
        <p className="font-display text-[10px] uppercase tracking-[0.2em] text-lab-teal">
          Inventory
        </p>
        <div className="mt-1.5 flex gap-1.5">
          <button
            type="button"
            onClick={() => openModal("equipment")}
            className="flex-1 rounded-lg border border-lab-line/60 bg-white/90 px-1.5 py-1 text-[11px] font-medium text-lab-ink shadow-sm transition hover:border-lab-teal/50 hover:bg-white"
          >
            Equipment
          </button>
          <button
            type="button"
            onClick={() => openModal("chemicals")}
            className="flex-1 rounded-lg border border-lab-teal/35 bg-lab-teal/10 px-1.5 py-1 text-[11px] font-medium text-lab-teal shadow-sm transition hover:bg-lab-teal/15"
          >
            Chemicals
          </button>
        </div>
        <p className="mt-1.5 text-[10px] leading-snug text-lab-muted">
          Drag onto desk, or tap{" "}
          <span className="font-semibold text-lab-teal">+</span> to place / use.
        </p>
        {targetVessel ? (
          <p className="mt-1.5 truncate rounded-md bg-lab-teal/10 px-1.5 py-0.5 text-[10px] text-lab-teal">
            Pour target:{" "}
            {EQUIPMENT_BY_ID[targetVessel.equipmentId]?.name ?? "vessel"}
            {targetVessel.contentIds.length
              ? ` · ${targetVessel.contentIds.length} inside`
              : ""}
          </p>
        ) : null}
        {goal ? (
          <p className="mt-1.5 rounded-md border border-lab-amber/30 bg-lab-amber/10 px-1.5 py-1 text-[10px] leading-snug text-lab-ink/80">
            <span className="font-semibold text-lab-amber">For this goal:</span>{" "}
            {goal.icon} {goal.title} — highlighted items below match the recipe.
          </p>
        ) : null}
      </div>

      <div className="scroll-thin flex-1 space-y-1 overflow-y-auto px-2 py-1.5">
        {goal
          ? equipment
              .filter((item) => highlightIds.has(item.id))
              .map((item) => (
                <DraggableItem
                  key={`goal-${item.id}`}
                  item={item}
                  payload={{ type: "equipment", itemId: item.id }}
                  subtitle={item.subcategory}
                  onQuickAdd={() => quickEquipment(item.id)}
                  hint="Needed for your goal"
                  highlighted
                  dragIdPrefix="goal-eq"
                />
              ))
          : null}
        {goal
          ? items
              .filter((item) => highlightIds.has(item.id))
              .map((item) => {
                const chem = getChemical(item.id);
                return (
                  <DraggableItem
                    key={`goal-chem-${item.id}`}
                    item={item}
                    payload={{ type: "chemical", itemId: item.id }}
                    subtitle={chem?.formula}
                    accentColor={chem?.color}
                    onQuickAdd={() => quickChemical(item.id)}
                    hint="Needed for your goal"
                    highlighted
                    dragIdPrefix="goal-chem"
                  />
                );
              })
          : null}
        {equipment.map((item) => (
          <DraggableItem
            key={item.id}
            item={item}
            payload={{ type: "equipment", itemId: item.id }}
            subtitle={item.subcategory}
            onQuickAdd={() => quickEquipment(item.id)}
            hint="Place or use on active vessel"
            highlighted={highlightIds.has(item.id)}
          />
        ))}
      </div>

      {modalUi}
    </aside>
    </>
  );
}
