import { es, enUS } from 'date-fns/locale';
import i18n from '../i18n/config';

export const getDateLocale = () => {
  return i18n.language === 'es' ? es : enUS;
};
