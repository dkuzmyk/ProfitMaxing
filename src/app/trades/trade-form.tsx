"use client";

import Link from "next/link";

function getLocalDateTimeValue() {
  const now = new Date();
  const timezoneOffset = now.getTimezoneOffset();
  const localDate = new Date(now.getTime() - timezoneOffset * 60000);

  return localDate.toISOString().slice(0, 16);
}

function toIsoString(value: string) {
  if (!value) {
    return "";
  }

  return new Date(value).toISOString();
}

function toLocalDateTimeValue(value?: string | null) {
  if (!value) {
    return getLocalDateTimeValue();
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return getLocalDateTimeValue();
  }

  const timezoneOffset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - timezoneOffset * 60000);

  return localDate.toISOString().slice(0, 16);
}

type TradeFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  submitLabel?: string;
  secondarySubmitLabel?: string | null;
  cancelHref?: string | null;
  cancelLabel?: string;
  initialValues?: {
    tradeId?: string;
    symbol?: string;
    setup?: string | null;
    direction?: "Long" | "Short";
    quantity?: number;
    entryPrice?: number;
    openedAt?: string;
    exitPrice?: number | null;
    closedAt?: string | null;
    notes?: string | null;
  };
};

export function TradeForm({
  action,
  submitLabel = "Save trade",
  secondarySubmitLabel = "Save and add another",
  cancelHref = null,
  cancelLabel = "Cancel",
  initialValues,
}: TradeFormProps) {
  const openedAtLocal = toLocalDateTimeValue(initialValues?.openedAt);
  const closedAtLocal = toLocalDateTimeValue(initialValues?.closedAt);
  const isClosed = Boolean(initialValues?.exitPrice && initialValues?.closedAt);

  return (
    <form
      action={action}
      onSubmit={(event) => {
        const form = event.currentTarget;
        const openedAtInput = form.elements.namedItem(
          "openedAt",
        ) as HTMLInputElement | null;
        const closedAtInput = form.elements.namedItem(
          "closedAt",
        ) as HTMLInputElement | null;
        const openedAtLocalInput = form.elements.namedItem(
          "openedAtLocal",
        ) as HTMLInputElement | null;
        const closedAtLocalInput = form.elements.namedItem(
          "closedAtLocal",
        ) as HTMLInputElement | null;
        const isClosedInput = form.elements.namedItem(
          "isClosed",
        ) as HTMLInputElement | null;
        const nextIsClosed = Boolean(isClosedInput?.checked);

        if (openedAtInput && openedAtLocalInput) {
          openedAtInput.value = toIsoString(openedAtLocalInput.value);
        }

        if (closedAtInput && closedAtLocalInput) {
          closedAtInput.value = nextIsClosed
            ? toIsoString(closedAtLocalInput.value)
            : "";
        }
      }}
      className="flex flex-col gap-6"
    >
      {initialValues?.tradeId ? (
        <input type="hidden" name="tradeId" value={initialValues.tradeId} />
      ) : null}
      <input type="hidden" name="openedAt" />
      <input type="hidden" name="closedAt" />

      <section className="grid gap-4 md:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-[24px] border border-white/8 bg-[#1e1f22] p-5">
          <label
            htmlFor="symbol"
            className="text-xs font-medium uppercase tracking-[0.18em] text-[#949ba4]"
          >
            Symbol
          </label>
          <input
            id="symbol"
            name="symbol"
            type="text"
            required
            autoFocus={!initialValues}
            defaultValue={initialValues?.symbol ?? ""}
            placeholder="AAPL"
            className="mt-3 w-full rounded-2xl border border-white/10 bg-[#111214] px-4 py-3 text-lg font-semibold uppercase tracking-wide text-white outline-none transition placeholder:text-[#6d7278] focus:border-[#5865f2]"
          />
        </div>

        <div className="rounded-[24px] border border-white/8 bg-[#1e1f22] p-5">
          <label
            htmlFor="setup"
            className="text-xs font-medium uppercase tracking-[0.18em] text-[#949ba4]"
          >
            Setup
          </label>
          <input
            id="setup"
            name="setup"
            type="text"
            defaultValue={initialValues?.setup ?? ""}
            placeholder="Opening range breakout"
            className="mt-3 w-full rounded-2xl border border-white/10 bg-[#111214] px-4 py-3 text-sm text-white outline-none transition placeholder:text-[#6d7278] focus:border-[#5865f2]"
          />
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-[24px] border border-white/8 bg-[#1e1f22] p-5">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-[#949ba4]">
            Direction
          </p>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <label className="cursor-pointer">
              <input
                type="radio"
                name="direction"
                value="Long"
                defaultChecked={(initialValues?.direction ?? "Long") === "Long"}
                className="peer sr-only"
              />
              <span className="flex items-center justify-center rounded-2xl border border-white/10 bg-[#111214] px-4 py-3 text-sm font-medium text-[#dbdee1] transition peer-checked:border-[#5865f2] peer-checked:bg-[#5865f2]/15 peer-checked:text-white">
                Long
              </span>
            </label>
            <label className="cursor-pointer">
              <input
                type="radio"
                name="direction"
                value="Short"
                defaultChecked={initialValues?.direction === "Short"}
                className="peer sr-only"
              />
              <span className="flex items-center justify-center rounded-2xl border border-white/10 bg-[#111214] px-4 py-3 text-sm font-medium text-[#dbdee1] transition peer-checked:border-[#5865f2] peer-checked:bg-[#5865f2]/15 peer-checked:text-white">
                Short
              </span>
            </label>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-[24px] border border-white/8 bg-[#1e1f22] p-5">
            <label
              htmlFor="quantity"
              className="text-xs font-medium uppercase tracking-[0.18em] text-[#949ba4]"
            >
              Quantity
            </label>
            <input
              id="quantity"
              name="quantity"
              type="number"
              min="1"
              step="1"
              required
              defaultValue={initialValues?.quantity ?? ""}
              placeholder="100"
              className="mt-3 w-full rounded-2xl border border-white/10 bg-[#111214] px-4 py-3 text-sm text-white outline-none transition placeholder:text-[#6d7278] focus:border-[#5865f2]"
            />
          </div>

          <div className="rounded-[24px] border border-white/8 bg-[#1e1f22] p-5">
            <label
              htmlFor="entryPrice"
              className="text-xs font-medium uppercase tracking-[0.18em] text-[#949ba4]"
            >
              Entry Price
            </label>
            <input
              id="entryPrice"
              name="entryPrice"
              type="number"
              min="0"
              step="0.0001"
              required
              defaultValue={initialValues?.entryPrice ?? ""}
              placeholder="182.45"
              className="mt-3 w-full rounded-2xl border border-white/10 bg-[#111214] px-4 py-3 text-sm text-white outline-none transition placeholder:text-[#6d7278] focus:border-[#5865f2]"
            />
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
        <div className="rounded-[24px] border border-white/8 bg-[#1e1f22] p-5">
          <label
            htmlFor="openedAtLocal"
            className="text-xs font-medium uppercase tracking-[0.18em] text-[#949ba4]"
          >
            Opened At
          </label>
          <input
            id="openedAtLocal"
            name="openedAtLocal"
            type="datetime-local"
            required
            defaultValue={openedAtLocal}
            className="mt-3 w-full rounded-2xl border border-white/10 bg-[#111214] px-4 py-3 text-sm text-white outline-none transition focus:border-[#5865f2]"
          />
        </div>

        <div className="rounded-[24px] border border-white/8 bg-[#1e1f22] p-5">
          <label className="flex items-center gap-3 text-sm text-[#dbdee1]">
            <input
              type="checkbox"
              name="isClosed"
              defaultChecked={isClosed}
              className="h-4 w-4 rounded border-white/15 bg-[#111214] text-[#5865f2] accent-[#5865f2]"
            />
            This trade is already closed
          </label>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="exitPrice"
                className="text-xs font-medium uppercase tracking-[0.18em] text-[#949ba4]"
              >
                Exit Price
              </label>
              <input
                id="exitPrice"
                name="exitPrice"
                type="number"
                min="0"
                step="0.0001"
                defaultValue={initialValues?.exitPrice ?? ""}
                placeholder="184.10"
                className="mt-3 w-full rounded-2xl border border-white/10 bg-[#111214] px-4 py-3 text-sm text-white outline-none transition placeholder:text-[#6d7278] focus:border-[#5865f2]"
              />
            </div>

            <div>
              <label
                htmlFor="closedAtLocal"
                className="text-xs font-medium uppercase tracking-[0.18em] text-[#949ba4]"
              >
                Closed At
              </label>
              <input
                id="closedAtLocal"
                name="closedAtLocal"
                type="datetime-local"
                defaultValue={isClosed ? closedAtLocal : ""}
                className="mt-3 w-full rounded-2xl border border-white/10 bg-[#111214] px-4 py-3 text-sm text-white outline-none transition focus:border-[#5865f2]"
              />
            </div>
          </div>

          <p className="mt-4 text-sm leading-7 text-[#949ba4]">
            Leave close details empty for open trades. Add them later when the
            position is finished.
          </p>
        </div>
      </section>

      <section className="rounded-[24px] border border-white/8 bg-[#1e1f22] p-5">
        <label
          htmlFor="notes"
          className="text-xs font-medium uppercase tracking-[0.18em] text-[#949ba4]"
        >
          Notes
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={4}
          defaultValue={initialValues?.notes ?? ""}
          placeholder="Optional quick notes about thesis, mistakes, or context."
          className="mt-3 w-full rounded-2xl border border-white/10 bg-[#111214] px-4 py-3 text-sm text-white outline-none transition placeholder:text-[#6d7278] focus:border-[#5865f2]"
        />
      </section>

      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          type="submit"
          name="intent"
          value="dashboard"
          className="rounded-2xl bg-[#5865f2] px-5 py-3 text-sm font-medium text-white transition hover:bg-[#4752c4]"
        >
          {submitLabel}
        </button>
        {secondarySubmitLabel ? (
          <button
            type="submit"
            name="intent"
            value="add-another"
            className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-medium text-[#dbdee1] transition hover:bg-white/10"
          >
            {secondarySubmitLabel}
          </button>
        ) : null}
        {cancelHref ? (
          <Link
            href={cancelHref}
            className="rounded-2xl border border-white/10 bg-[#1e1f22] px-5 py-3 text-center text-sm font-medium text-[#dbdee1] transition hover:bg-[#111214]"
          >
            {cancelLabel}
          </Link>
        ) : null}
      </div>
    </form>
  );
}
