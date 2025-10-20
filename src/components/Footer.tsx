import { Link } from "react-router-dom";
import { Car, Facebook, Instagram, Twitter } from "lucide-react";
import { useTranslation } from "react-i18next";

const Footer = () => {
  const { t } = useTranslation();
  
  return (
    <footer className="border-t bg-secondary/30 py-12">
      <div className="container">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Car className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold">AndaYa</span>
            </div>
            <p className="text-sm text-muted-foreground">
              {t('footer.tagline')}
            </p>
          </div>
          
          <div>
            <h3 className="mb-4 font-semibold">{t('footer.for_users')}</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/explorar" className="text-muted-foreground hover:text-foreground">
                  {t('footer.search_cars')}
                </Link>
              </li>
              <li>
                <Link to="/registro" className="text-muted-foreground hover:text-foreground">
                  {t('footer.register')}
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="mb-4 font-semibold">{t('footer.for_owners')}</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/owner/vehicles/new" className="text-muted-foreground hover:text-foreground">
                  {t('footer.list_car')}
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="mb-4 font-semibold">{t('footer.legal')}</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/politica-verificacion" className="text-muted-foreground hover:text-foreground">
                  {t('footer.verification_policy')}
                </Link>
              </li>
              <li>
                <Link to="/tratamiento-datos" className="text-muted-foreground hover:text-foreground">
                  {t('footer.data_treatment')}
                </Link>
              </li>
              <li>
                <Link to="/terminos" className="text-muted-foreground hover:text-foreground">
                  {t('footer.terms')}
                </Link>
              </li>
              <li>
                <Link to="/transparencia" className="text-muted-foreground hover:text-foreground">
                  {t('footer.transparency')}
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="mb-4 font-semibold">{t('footer.follow_us')}</h3>
            <div className="flex gap-4">
              <a href="https://facebook.com/andaya" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground" aria-label="Facebook">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="https://instagram.com/andaya" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground" aria-label="Instagram">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="https://twitter.com/andaya" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground" aria-label="Twitter">
                <Twitter className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>
        
        <div className="mt-8 border-t pt-8 text-center text-sm text-muted-foreground">
          <p>&copy; 2025 AndaYa. {t('footer.rights_reserved')}</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

