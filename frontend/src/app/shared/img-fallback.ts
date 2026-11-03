import { Directive, ElementRef, inject } from '@angular/core';

/** Soft pink placeholder used when a photo is missing (e.g. images not added yet). */
const PLACEHOLDER =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 260"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fde6e8"/><stop offset="1" stop-color="#faeee8"/></linearGradient></defs><rect width="400" height="260" fill="url(#g)"/><path d="M200 102l7 20 20 7-20 7-7 20-7-20-20-7 20-7z" fill="#f2a7b4"/></svg>`,
  );

@Directive({
  selector: 'img[appImgFallback]',
  host: { '(error)': 'useFallback()' },
})
export class ImgFallback {
  private readonly img = inject<ElementRef<HTMLImageElement>>(ElementRef).nativeElement;

  protected useFallback() {
    if (this.img.src !== PLACEHOLDER) this.img.src = PLACEHOLDER;
  }
}
