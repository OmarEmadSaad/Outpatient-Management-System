import type { SweetAlertOptions, SweetAlertResult } from "sweetalert2";

export const showAlert = async (
  options: SweetAlertOptions
): Promise<SweetAlertResult> => {
  const { default: Swal } = await import("sweetalert2");
  return Swal.fire(options);
};

export const confirmAction = async (options: SweetAlertOptions): Promise<boolean> =>
  (await showAlert({ showCancelButton: true, ...options })).isConfirmed;
