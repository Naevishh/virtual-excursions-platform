import { useEffect, useState } from "react";

interface StopImageProps {
  src?: string | null;
  alt: string;
  fallback: string;
}

/** Картинка точки экскурсии; если файла нет — аккуратная заглушка. */
export default function StopImage({ src, alt, fallback }: StopImageProps) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  if (!src || failed) {
    return (
      <div className="photo-placeholder excursion-placeholder">
        <span>{fallback}</span>
      </div>
    );
  }

  return <img src={src} alt={alt} onError={() => setFailed(true)} />;
}
