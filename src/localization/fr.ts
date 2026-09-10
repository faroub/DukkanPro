export default {
  // 1. common — general UI labels, buttons, actions
  common: {
    appText: "Texte de l'application",
    screen: "Écran",
    header: "En-tête",
    back: "Retour",
    action: "Action",
    primaryButton: "Bouton principal",
    secondaryButton: "Bouton secondaire",
    iconButton: "Icône",
    card: "Carreau",
    emptyState: "État vide",
    icon: "Icône",
    title: "Titre",
    subtitle: "Sous-titre",
    loading: "Chargement",
    error: "Erreur",
    retry: "Réessayer",
    notFound: "Page introuvable",
    notFoundBackToHome: "Retour à l'accueil",
    confirmDialog: "Confirmation",
    confirmTitle: "Confirmation",
    confirmMessage: "Êtes-vous sûr de vouloir continuer ?",
    confirmCancel: "Annuler",
    confirmOk: "OK",
    money: "DZD",
    positive: "Positif",
    negative: "Négatif",
    search: "Recherche",
    placeholder: "Rechercher...",
    formField: "Champ",
    label: "Libellé",
    errorMessage: "Erreur",
    statusPaid: "Payé",
    statusPartial: "Partiel",
    statusCancelled: "Annulé"
  },

  // 2. onboarding — onboarding flow strings
  onboarding: {
    appText: "Texte de l'application",
    screen: "Écran",
    header: "En-tête",
    back: "Retour",
    title: "Bienvenue sur Dukkan OS",
    subtitle: "Application pour micro-entrepreneurs algériens",
    description: "Enregistrez les ventes, suivez les clients, gérez les stocks",
    getStarted: "Commencer",
    skip: "Sauter"
  },

  // 3. navigation — tab labels, headers
  navigation: {
    home: "Accueil",
    products: "Produits",
    sales: "Ventes",
    customers: "Clients",
    catalogue: "Catalogue",
    more: "Plus",
    dashboard: "Tableau de bord",
    settings: "Paramètres",
    profile: "Profil",
    logout: "Déconnexion"
  },

  // 4. dashboard — dashboard cards, summaries
  dashboard: {
    title: "Tableau de bord",
    totalSales: "Ventes totales",
    totalCustomers: "Clients totaux",
    lowStockAlert: "Alerte de stock faible",
    estimatedProfit: "Profit estimé",
    todaySales: "Ventes d'aujourd'hui",
    thisWeek: "Cette semaine",
    thisMonth: "Ce mois",
    stockValue: "Valeur du stock",
    noSalesYet: "Pas de ventes encore",
    newSale: "Nouvelle vente"
  },

  // 5. products — product management
  products: {
    title: "Produits",
    subtitle: "Gestion des produits",
    addProduct: "Ajouter un produit",
    editProduct: "Modifier le produit",
    name: "Nom",
    description: "Description",
    price: "Prix",
    costPrice: "Prix d'achat",
    barcode: "Code-barres",
    sku: "SKU",
    category: "Catégorie",
    status: "Statut",
    active: "Actif",
    inactive: "Inactif",
    save: "Enregistrer",
    cancel: "Annuler",
    delete: "Supprimer",
    noProductsYet: "Aucun produit pour l'instant",
    totalItems: "Articles totaux",
    totalValue: "Valeur totale",
    lowStockCount: "Stock faible ({count})",
  },

  // 6. inventory — stock, movements
  inventory: {
    title: "Stock",
    subtitle: "Gestion du stock",
    totalItems: "Articles totaux",
    lowStock: "Stock faible",
    outOfStock: "Rupture de stock",
    restock: "Réapprovisionnement",
    addStock: "Ajouter du stock",
    removeStock: "Retirer du stock",
    movementTitle: "Mouvement de stock",
    movementIn: "Entrée",
    movementOut: "Sortie",
    date: "Date",
    quantity: "Quantité",
    product: "Produit",
    noStockYet: " aucune mouvement de stock pour l'instant"
  },

  // 7. sales — sale flow, cart, checkout
  sales: {
    title: "Ventes",
    subtitle: "Flux de ventes",
    newSale: "Nouvelle vente",
    cart: "Panier",
    checkout: "Caisses",
    paymentMethod: "Méthode de paiement",
    cash: "Espèces",
    electronic: "Électronique",
    mixed: "Mixte",
    partial: "Partiel",
    credit: "Crédit",
    amount: "Montant",
    quantity: "Quantité",
    total: "Total",
    change: "Reste",
    pay: "Payer",
    confirmSale: "Confirmer la vente",
    saleCancelled: "Vente annulée",
    saleCompleted: "Vente terminée",
    noSalesYet: "Pas de ventes pour l'instant"
  },

  // 8. customers — customer management
  customers: {
    title: "Clients",
    subtitle: "Gestion des clients",
    addCustomer: "Ajouter un client",
    editCustomer: "Modifier le client",
    name: "Nom",
    phone: "Téléphone",
    email: "E-mail",
    debt: "Dette",
    creditLimit: "Limite de crédit",
    totalDebt: " Dette totale",
    payments: "Payements",
    addPayment: "Ajouter un paiement",
    viewDetails: "Voir les détails",
    noCustomersYet: "Aucun client pour l'instant"
  },

  // 9. payments — payment recording
  payments: {
    title: "Moyens de paiement",
    subtitle: "Enregistrement des paiements",
    receivePayment: "Recevoir un paiement",
    paymentAmount: "Montant du paiement",
    paymentMethod: "Méthode de paiement",
    cashPayment: "Paiement espèces",
    electronicPayment: "Paiement électronique",
    reference: "Référence",
    date: "Date",
    amountReceived: "Montant reçu",
    remainingBalance: "Solde restant",
    paymentCompleted: "Paiement terminé",
    noPaymentsYet: "Aucun paiement pour l'instant"
  },

  // 10. catalogue — catalogue generation
  catalogue: {
    title: "Catalogue",
    subtitle: "Génération du catalogue",
    generateCatalogue: "Générer le catalogue",
    productsIncluded: "Produits inclus",
    excludeCustomerData: "Exclure les données clients",
    generate: "Générer",
    csvFormat: "Format CSV",
    exporting: "Exportation",
    catalogueExported: "Catalogue exporté",
    noProductsForCatalogue: "Pas de produits pour le catalogue"
  },

  // 11. receipts — receipt text
  receipts: {
    title: "Recu",
    subtitle: "Texu du reçu",
    storeName: "Nom du magasin",
    storeAddress: "Adresse du magasin",
    date: "Date",
    time: "Heure",
    saleItems: "Articles de la vente",
    subtotal: "Sous-total",
    tax: "Taxe",
    totalAmount: "Montant total",
    amountPaid: "Montant payé",
    changeDue: "Reste",
    customerName: "Nom du client",
    phoneNumber: "Numéro de téléphone",
    thankYou: "Merci de votre visite",
    comeAgain: "Nous espérons vous revoir bientôt"
  },

  // 12. exports — CSV export labels
  exports: {
    title: "Exportation",
    subtitle: "Exportation de données",
    exportCSV: "Exporter CSV",
    exportSelected: "Exporter la sélection",
    exportAll: "Exporter tout",
    columns: "Colonnes",
    dateRange: "Plage de dates",
    from: "Depuis",
    to: "Jusqu'à",
    exportingData: "Exportation en cours",
    exportCompleted: "Exportation terminée",
    exportFailed: "Échec de l'exportation",
    selectingData: "Sélectionnez les données à exporter",
    noDataToExport: "Aucune donnée à exporter"
  },

  // 13. settings — settings sections
  settings: {
    title: "Paramètres",
    subtitle: "Paramètres de l'application",
    general: "Général",
    language: "Langue",
    currency: "Devise",
    notifications: "Notifications",
    about: "À propos",
    version: "Version",
    rateApp: "Évaluez l'application",
    shareApp: "Partagez l'application",
    logoutAllSessions: "Déconnexion de toutes les sessions",
    resetApp: "Réinitialiser l'application",
    languageArabic: "Arabe",
    languageFrench: "Français",
    languageEnglish: "Anglais",
    default: "Par défaut"
  },

  // 14. voice — voice command messages
  voice: {
    title: "Commandes vocales",
    subtitle: "Découvrez les commandes",
    listening: "En écoute",
    listeningError: "Erreur d'écoute",
    commandNotRecognized: "Commande non reconnue",
    sayProductName: "Dites le nom du produit",
    sayPrice: "Dites le prix",
    sayQuantity: "Dites la quantité",
    startSale: "Commencer la vente",
    cancelSale: "Annuler la vente",
    takePhoto: "Prendre une photo"
  },

  // 15. errors — error messages
  errors: {
    title: "Erreur",
    genericError: "Erreur générale",
    networkError: "Erreur de réseau",
    tryAgain: "Essayez encore",
    somethingWentWrong: "Quelque chose s'est mal passé",
    invalidInput: "Entrée invalide",
    requiredField: "Champ requis",
    unableToLoad: "Impossible de charger",
    unableToSave: "Impossible de sauvegarder",
    operationCancelled: "Opération annulée"
  },

  // 16. confirmations — confirmation dialog messages
  confirmations: {
    title: "Confirmation",
    message: "Êtes-vous sûr ?",
    cancel: "Annuler",
    ok: "OK",
    deleteItem: "Supprimer cet élément ?",
    deleteSale: "Supprimer cette vente ?",
    clearDatabase: "Effacer la base de données ?",
    thisActionCannotBeUndone: "Cet acte ne peut pas être annulé",
    yesDelete: "Oui, supprimer",
    noKeep: "Non, conserver"
  },

  // 17. emptyStates — empty list messages
  emptyStates: {
    title: "Aucun élément",
    subtitle: "La liste est vide",
    description: "Il n'y a pas d'éléments pour l'instant. Ajoutez le premier élément",
    addFirstItem: "Ajouter le premier élément",
    noProducts: "Pas de produits",
    noCustomers: "Pas de clients",
    noSales: "Pas de ventes",
    noPayments: "Pas de paiements",
    noInventory: "Pas de mouvement de stock"
  },

  // 18. permissions — permission request messages
  permissions: {
    title: "Demandes d'autorisations",
    camera: "Accès à la caméra",
    microphone: "Accès au microphone",
    storage: "Accès au stockage",
    location: "Accès à la localisation",
    cameraDescription: "Cette fonctionnalité nécessite l'accès à la caméra",
    microphoneDescription: "Cette fonctionnalité nécessite l'accès au microphone",
    storageDescription: "Cette fonctionnalité nécessite l'accès au stockage",
    locationDescription: "Cette fonctionnalité nécessite l'accès à la localisation",
    deny: "Refuser",
    allow: "Autoriser"
  }
};