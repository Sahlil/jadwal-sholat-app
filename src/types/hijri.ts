/** Envelope respons API aladhan.com (beda dari myQuran). */
export interface AladhanResponse<T> {
  code: number;
  status: string;
  data: T;
}

export interface AladhanHijri {
  day: string;
  month: {
    number: number;
    en: string;
  };
  year: string;
  holidays?: string[];
}

export interface AladhanCalendarDay {
  hijri: AladhanHijri;
  /** "DD-MM-YYYY" */
  gregorian: {
    date: string;
  };
}

export interface HijriDate {
  day: number;
  month: number;
  year: number;
  holidays: string[];
}

/** Peta tanggal gregorian "YYYY-MM-DD" -> tanggal hijriyahnya. */
export type HijriMonthMap = Record<string, HijriDate>;
