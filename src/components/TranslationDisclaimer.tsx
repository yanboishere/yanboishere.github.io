import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, X } from "lucide-react";

interface Props {
  open: boolean;
  langLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function TranslationDisclaimer({ open, langLabel, onConfirm, onCancel }: Props) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={onCancel}
        >
          <motion.div
            initial={{ scale: 0.92, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.92, opacity: 0 }}
            transition={{ type: "spring", damping: 25 }}
            className="bg-white dark:bg-gray-900 rounded-2xl p-6 md:p-8 max-w-md w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-2">
                <AlertTriangle size={20} className="text-sunset-500" />
                <h3 className="font-display text-lg font-bold text-gray-900 dark:text-gray-100">
                  Translation Notice
                </h3>
              </div>
              <button onClick={onCancel} className="p-1 rounded-lg hover:bg-warm-100 dark:hover:bg-gray-800 transition-colors">
                <X size={18} className="text-gray-400" />
              </button>
            </div>

            <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
              <p>
                This blog will be translated to <strong className="text-gray-800 dark:text-gray-200">{langLabel}</strong> using{" "}
                <strong className="text-gray-800 dark:text-gray-200">Google Translate</strong>.
              </p>
              <div className="p-3 rounded-xl bg-warm-50 dark:bg-gray-800/50 border border-warm-200/40 dark:border-gray-700/40">
                <p className="text-xs text-gray-500 dark:text-gray-500 leading-relaxed">
                  ⚠️ Disclaimer: Translation is provided by Google Translate, an external third-party service. 
                  The accuracy of translations is not guaranteed. This site assumes no responsibility for 
                  any translation errors or inaccuracies. The original content is written in Chinese (中文).
                </p>
              </div>
              <p className="text-xs text-gray-400 dark:text-gray-500">
                免责声明：翻译由第三方服务 Google Translate 提供，翻译准确性无法保证。本站对翻译错误或不准确之处不承担责任。原始内容为中文。
              </p>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={onCancel}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-400 bg-warm-100 dark:bg-gray-800 hover:bg-warm-200 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel / 取消
              </button>
              <button
                onClick={onConfirm}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-white bg-forest-600 dark:bg-forest-500 hover:bg-forest-700 dark:hover:bg-forest-600 transition-colors"
              >
                I understand / 我知道了
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
