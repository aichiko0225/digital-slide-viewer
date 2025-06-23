import { OsdManager } from "i-viewer-lib";
import { useRef, useEffect } from "react";

/** DigitalSlideViewer Component
 * @returns {JSX.Element}
 * @description 该组件用于创建一个 OpenSeadragon 视图，用于显示切片图像
 */
function DigitalSlideViewer({ tileSources, fileCode, tileServiceUrl }) {

  const osdRef = useRef(null);
  /** @type {React.RefObject<OpenSeadragon.Viewer>} */
  const osdInstance = useRef(null);

  useEffect(() => {
    if (tileServiceUrl) {
      // /slice/query/img/<string:file_code>/<int:level>/<string:img_name>/
      requestUrl.current = `${tileServiceUrl}/slice/query/img/${fileCode}`;
    }
  }, [tileServiceUrl, fileCode]);

  useEffect(() => {
    if (osdRef.current) {
      osdInstance.current = new OsdManager({
        id: osdRef.current.id,
        tileSources: {
          width: tileSources.width,
          height: tileSources.height,
          tileSize: tileSources.tileSize || 256,
          magnification: tileSources.magnification || 40,
          getTileUrl: (level, col, row) => {
            return `${level}/${col}_${row}`
          },
          downloadTileStart: async (context) => {
            const { src } = context;
            const req_url = `${requestUrl.current}/${src}.jpg`;
            const controller = new AbortController();
            context.abort = () => controller.abort();
            try {
              const response = await fetch(req_url, { signal: controller.signal });
              if (!response.ok) throw new Error('Tile fetch failed');
              const blob = await response.blob();
              const objectUrl = URL.createObjectURL(blob);

              const img = new Image();
              img.onload = () => {
                context.finish(img);
                URL.revokeObjectURL(objectUrl);
              };
              img.onerror = (e) => {
                context.finish(null, null, 'Image load error');
                URL.revokeObjectURL(objectUrl);
              };
              img.src = objectUrl;
            } catch (err) {
              context.finish(null, null, err.message || 'Tile load error');
            }
          },
          downloadTileAbort: (context) => {
            if (context.abort) context.abort();
          }
        },
      });
    }
    return () => {
      // 卸载时销毁实例
      osdInstance.current && osdInstance.current.destroy();
    };
  }, [tileSources]);

  return (
    <div
      id="osd-viewer"
      className="w-screen h-screen relative"
      ref={osdRef}
    />
  );
}

export default DigitalSlideViewer;