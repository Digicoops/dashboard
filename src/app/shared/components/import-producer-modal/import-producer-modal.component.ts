import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

import * as XLSX from 'xlsx';
import { Router } from '@angular/router';
import {ModalComponent} from "../ui/modal/modal.component";
import {ButtonComponent} from "../ui/button/button.component";
import {ModalService} from "../../services/modal.service";
import {
    AgriculturalProducerManagementService
} from "../../../core/services/producer/agricultural-producer-management.service";

interface ImportResult {
    total: number;
    success: number;
    failed: number;
    failedDetails: Array<{
        row: number;
        data: any;
        error: string;
    }>;
}

@Component({
    selector: 'app-import-producer-modal',
    imports: [CommonModule, ModalComponent, ButtonComponent],
    templateUrl: './import-producer-modal.component.html',
    styles: ``,
    standalone: true
})
export class ImportProducerModalComponent {
    @Output() importComplete = new EventEmitter<ImportResult>();

    isOpen = false;
    showResultModal = false;
    isLoading = false;
    isDragging = false;
    selectedFile: File | null = null;
    errorMessage = '';
    importResult: ImportResult | null = null;
    hasError = false;

    // Dans votre composant TS
    previewData: any[] = [];
    showPreview = false;

    constructor(
        public modal: ModalService,
        private producerManagement: AgriculturalProducerManagementService,
        private router: Router
    ) {}

    openModal() {
        this.isOpen = true;
        this.resetState();
    }

    closeModal() {
        this.isOpen = false;
        this.resetState();
    }

    openResultModal() {
        this.showResultModal = true;
    }

    closeResultModal() {
        this.showResultModal = false;
    }

    private resetState() {
        this.selectedFile = null;
        this.errorMessage = '';
        this.importResult = null;
        this.isLoading = false;
        this.isDragging = false;
    }

    // Gestion du drag & drop
    onDragOver(event: DragEvent) {
        event.preventDefault();
        event.stopPropagation();
        this.isDragging = true;
    }

    onDragLeave(event: DragEvent) {
        event.preventDefault();
        event.stopPropagation();
        this.isDragging = false;
    }

    onFileDrop(event: DragEvent) {
        event.preventDefault();
        event.stopPropagation();
        this.isDragging = false;

        if (event.dataTransfer?.files.length) {
            const file = event.dataTransfer.files[0];
            this.validateAndSetFile(file);
        }
    }

    onFileSelected(event: Event) {
        const input = event.target as HTMLInputElement;
        if (input.files?.length) {
            const file = input.files[0];
            this.validateAndSetFile(file);
        }
    }

    private async validateAndSetFile(file: File) {
        // Validation du type de fichier
        const validTypes = [
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-excel'
        ];
        const validExtensions = ['.xlsx', '.xls'];

        const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();

        if (!validTypes.includes(file.type) && !validExtensions.includes(fileExtension)) {
            this.errorMessage = 'Format de fichier non supporté. Veuillez utiliser un fichier Excel (.xlsx, .xls)';
            this.hasError = true;
            return;
        }

        // Validation de la taille (10MB max)
        if (file.size > 10 * 1024 * 1024) {
            this.errorMessage = 'Le fichier est trop volumineux. Taille maximum : 10MB';
            this.hasError = true;
            return;
        }

        this.selectedFile = file;
        this.errorMessage = '';
        this.hasError = false;


        // Lire un aperçu des données
        await this.previewExcelFile(file);
    }

    private async previewExcelFile(file: File): Promise<void> {
        try {
            const data = await this.readExcelFile(file);
            this.previewData = data.slice(0, 5); // Premières 5 lignes
            this.showPreview = true;
        } catch (error) {
            console.error('Erreur lors de la prévisualisation:', error);
            this.showPreview = false;
        }
    }

    removeFile() {
        this.selectedFile = null;
        this.errorMessage = '';
        this.previewData = [];
        this.showPreview = false;
    }

    async onImport() {
        if (!this.selectedFile) {
            this.errorMessage = 'Veuillez sélectionner un fichier';
            return;
        }

        this.isLoading = true;
        this.errorMessage = '';

        try {
            // Lire le fichier Excel
            const data = await this.readExcelFile(this.selectedFile);

            // Valider le format des données
            const validationResult = this.validateExcelData(data);
            if (!validationResult.isValid) {
                this.errorMessage = validationResult.error || 'Format de fichier invalide';
                this.isLoading = false;
                return;
            }

            // Vérifier les permissions
            const permissionCheck = await this.producerManagement.checkUserPermissions();
            if (!permissionCheck.hasPermission) {
                this.errorMessage = permissionCheck.error || 'Action non autorisée';
                this.isLoading = false;
                return;
            }

            // Importer les producteurs
            const result = await this.importProducers(data);
            this.importResult = result;

            // Afficher le modal de résultat
            this.closeModal();
            this.openResultModal();

            // Émettre l'événement
            this.importComplete.emit(result);

        } catch (error) {
            console.error('Erreur lors de l\'importation:', error);
            this.errorMessage = 'Une erreur est survenue lors de l\'importation. Veuillez réessayer.';
        } finally {
            this.isLoading = false;
        }
    }

    private readExcelFile(file: File): Promise<any[]> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = (e: any) => {
                try {
                    const data = new Uint8Array(e.target.result);
                    const workbook = XLSX.read(data, { type: 'array' });

                    // Prendre la première feuille
                    const firstSheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[firstSheetName];

                    // Convertir en JSON
                    const jsonData = XLSX.utils.sheet_to_json(worksheet);
                    resolve(jsonData);
                } catch (error) {
                    reject(error);
                }
            };

            reader.onerror = (error) => reject(error);
            reader.readAsArrayBuffer(file);
        });
    }

    private validateExcelData(data: any[]): { isValid: boolean; error?: string } {
        if (!data || data.length === 0) {
            return { isValid: false, error: 'Le fichier est vide ou ne contient aucune donnée' };
        }

        // Vérifier les colonnes requises
        const requiredColumns = ['first_name', 'last_name', 'email', 'farm_name'];
        const firstRow = data[0];
        const columns = Object.keys(firstRow);

        const missingColumns = requiredColumns.filter(col => !columns.includes(col));
        if (missingColumns.length > 0) {
            return {
                isValid: false,
                error: `Colonnes manquantes : ${missingColumns.join(', ')}. Veuillez utiliser le modèle fourni.`
            };
        }

        // Valeurs autorisées pour production_type
        const validProductionTypes = ['vegetables', 'fruits', 'cereals', 'livestock', 'dairy', 'poultry', 'mixed', 'organic'];

        // Liste des valeurs acceptées en français pour le message d'erreur
        const frenchLabels: { [key: string]: string } = {
            'vegetables': 'Légumes',
            'fruits': 'Fruits',
            'cereals': 'Céréales',
            'livestock': 'Élevage',
            'dairy': 'Produits laitiers',
            'poultry': 'Volaille',
            'mixed': 'Polyculture/Mixte',
            'organic': 'Biologique'
        };

        const validTypesDisplay = validProductionTypes.map(type => frenchLabels[type] || type).join(', ');

        // Vérifier les données
        for (let i = 0; i < data.length; i++) {
            const row = data[i];
            const rowNumber = i + 2;

            // Vérifier les champs requis
            if (!row.first_name?.trim()) {
                return { isValid: false, error: `Ligne ${rowNumber} : Le prénom est requis` };
            }
            if (!row.last_name?.trim()) {
                return { isValid: false, error: `Ligne ${rowNumber} : Le nom est requis` };
            }
            if (!row.email?.trim()) {
                return { isValid: false, error: `Ligne ${rowNumber} : L'email est requis` };
            }
            if (!this.isValidEmail(row.email)) {
                return { isValid: false, error: `Ligne ${rowNumber} : Email invalide (${row.email})` };
            }
            if (!row.farm_name?.trim()) {
                return { isValid: false, error: `Ligne ${rowNumber} : Le nom de l'exploitation est requis` };
            }

            // Validation optionnelle pour production_type
            if (row.production_type && row.production_type.toString().trim()) {
                const prodType = row.production_type.toString().trim().toLowerCase();
                const mappedType = this.mapProductionTypeForValidation(prodType);

                if (!validProductionTypes.includes(mappedType)) {
                    return {
                        isValid: false,
                        error: `Ligne ${rowNumber} : Type de production "${row.production_type}" invalide. Valeurs autorisées: ${validTypesDisplay}`
                    };
                }
            }
        }

        return { isValid: true };
    }

    private mapProductionTypeForValidation(type: string): string {
        const mapping: { [key: string]: string } = {
            'légumes': 'vegetables',
            'legumes': 'vegetables',
            'fruits': 'fruits',
            'cereals': 'cereals',
            'céréales': 'cereals',
            'livestock': 'livestock',
            'élevage': 'livestock',
            'dairy': 'dairy',
            'produits laitiers': 'dairy',
            'poultry': 'poultry',
            'volaille': 'poultry',
            'mixed': 'mixed',
            'polyculture': 'mixed',
            'organic': 'organic',
            'biologique': 'organic'
        };

        return mapping[type.toLowerCase()] || type;
    }



    getPreviewColumns(): string[] {
        if (this.previewData.length === 0) return [];
        return Object.keys(this.previewData[0]);
    }

    private extractErrorMessage(error: any): string {
        if (!error) return 'Erreur inconnue';

        // Si c'est une chaîne
        if (typeof error === 'string') {
            try {
                const parsed = JSON.parse(error);
                if (parsed?.message) return parsed.message;
                if (parsed?.error) return parsed.error;
                return error;
            } catch {
                return error;
            }
        }

        // Si c'est un objet
        if (typeof error === 'object') {
            if (error.message) return error.message;
            if (error.error) return error.error;
            if (error.statusText) return error.statusText;

            // Essayer de convertir l'objet en chaîne
            try {
                return JSON.stringify(error);
            } catch {
                return 'Erreur objet non serializable';
            }
        }

        return 'Erreur inconnue';
    }

    private async importProducers(data: any[]): Promise<ImportResult> {
        const result: ImportResult = {
            total: data.length,
            success: 0,
            failed: 0,
            failedDetails: []
        };

        // Valeurs exactes autorisées par la base de données
        const validProductionTypes = [
            'vegetables', 'fruits', 'cereals', 'livestock',
            'dairy', 'poultry', 'mixed', 'organic'
        ];

        // Mappage complet des valeurs possibles vers les valeurs valides
        const productionTypeMapping: { [key: string]: string } = {
            // Français vers anglais
            'légumes': 'vegetables',
            'legumes': 'vegetables',
            'fruits': 'fruits',
            'cereals': 'cereals',
            'céréales': 'cereals',
            'cereal': 'cereals',
            'livestock': 'livestock',
            'élevage': 'livestock',
            'elevage': 'livestock',
            'dairy': 'dairy',
            'produits laitiers': 'dairy',
            'laitier': 'dairy',
            'poultry': 'poultry',
            'volaille': 'poultry',
            'mixed': 'mixed',
            'mixte': 'mixed',
            'polyculture': 'mixed',
            'poly-culture': 'mixed',
            'organic': 'organic',
            'biologique': 'organic',
            'bio': 'organic',
            'agriculture biologique': 'organic',

            // Autres variations possibles
            'vegetable': 'vegetables',
            'fruit': 'fruits',
            'cattle': 'livestock',
            'livre': 'livestock', // possible faute de frappe
            'volailles': 'poultry',
            'poulet': 'poultry',
            'oeufs': 'poultry',
            'œufs': 'poultry',
            'lait': 'dairy',
            'fromage': 'dairy',
            'yaourt': 'dairy',
            'yogurt': 'dairy',
            'céréale': 'cereals',
            'blé': 'cereals',
            'maïs': 'cereals',
            'mais': 'cereals',
            'riz': 'cereals',
            'mélangé': 'mixed',
            'melange': 'mixed',
            'mélange': 'mixed',
            'diversifié': 'mixed',
            'diversifie': 'mixed',
            'organique': 'organic'
        };

        // Importer chaque producteur
        for (let i = 0; i < data.length; i++) {
            const row = data[i];
            const rowNumber = i + 2;

            try {
                // Normaliser et mapper le type de production
                let productionType = (row.production_type || '').toString().trim().toLowerCase();

                // Si vide, utiliser la valeur par défaut
                if (!productionType) {
                    productionType = 'mixed';
                }

                // Mapper la valeur
                let mappedType = productionTypeMapping[productionType];

                // Si non trouvé dans le mapping, essayer de trouver une correspondance partielle
                if (!mappedType) {
                    for (const [key, value] of Object.entries(productionTypeMapping)) {
                        if (productionType.includes(key) || key.includes(productionType)) {
                            mappedType = value;
                            break;
                        }
                    }
                }

                // Si toujours pas trouvé, utiliser 'mixed' par défaut
                if (!mappedType) {
                    mappedType = 'mixed';
                }

                // S'assurer que c'est une valeur valide
                if (!validProductionTypes.includes(mappedType)) {
                    mappedType = 'mixed';
                }

                // Préparer les données du producteur
                const producerData = {
                    first_name: row.first_name?.trim(),
                    last_name: row.last_name?.trim(),
                    email: row.email?.trim(),
                    phone: row.phone?.trim() || '',
                    farm_name: row.farm_name?.trim(),
                    location: row.location?.trim() || '',
                    production_type: mappedType, // Utiliser la valeur mappée et validée
                    description: row.description?.trim() || '',
                    password: this.generateRandomPassword(),
                    account_status: 'active'
                };

                // Log pour débogage
                console.log(`Ligne ${rowNumber}:`, {
                    original: row.production_type,
                    cleaned: productionType,
                    mapped: mappedType,
                    final: producerData.production_type
                });

                // Créer le producteur
                const createResult = await this.producerManagement.createProducer(producerData);

                if (createResult.success) {
                    result.success++;
                } else {
                    result.failed++;
                    result.failedDetails.push({
                        row: rowNumber,
                        data: producerData,
                        error: this.extractErrorMessage(createResult.error)
                    });
                }

            } catch (error: any) {
                result.failed++;
                result.failedDetails.push({
                    row: rowNumber,
                    data: row,
                    error: this.extractErrorMessage(error)
                });
            }
        }

        return result;
    }



    private generateRandomPassword(): string {
        // Générer un mot de passe aléatoire de 12 caractères
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
        let password = '';
        for (let i = 0; i < 12; i++) {
            password += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return password;
    }

    private isValidEmail(email: string): boolean {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    navigateToProducersList() {
        this.router.navigate(['/dashboard/list-producers']);
        this.closeResultModal();
    }
}