export const getTodayDateInputValue = (): string => {
  const today = new Date();

  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

export const getCurrentMonthInputValue = (): string => {
  const today = new Date();

  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");

  return `${year}-${month}`;
};

export const isFutureDate = (value: string): boolean => {
  if (!value) {
    return false;
  }

  const selectedDate = new Date(`${value}T00:00:00`);
  const today = new Date();

  today.setHours(0, 0, 0, 0);

  return selectedDate.getTime() > today.getTime();
};

export const isFutureMonth = (
  month: number,
  year: number
): boolean => {
  const today = new Date();

  const selectedMonthStart = new Date(
    year,
    month - 1,
    1
  );

  const currentMonthStart = new Date(
    today.getFullYear(),
    today.getMonth(),
    1
  );

  return selectedMonthStart.getTime() >
    currentMonthStart.getTime();
};