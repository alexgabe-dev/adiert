export const portalEventLabels: Record<string, string> = {
  'application.approved': 'Iskolai jelentkezés elfogadva',
  'application.needs_changes': 'Pontosítást kértünk a jelentkezéshez',
  'application.rejected': 'Iskolai jelentkezés elutasítva',
  'teacher.invited': 'Tanári meghívó létrehozva',
  'teacher.joined': 'Tanár csatlakozott az iskolához',
  'member.remove': 'Iskolai hozzáférés visszavonva',
  'member.revoke_invite': 'Meghívás visszavonva',
  'member.transfer_owner': 'Iskolai admin megváltoztatva',
  'submission.created': 'Új gyűjtés beküldve',
  'submission.resubmitted': 'Javított gyűjtés beküldve',
  'submission.approved': 'Gyűjtés jóváhagyva',
  'submission.rejected': 'Beküldés elutasítva',
  'submission.needs_review': 'Javítást kértünk a beküldéshez',
  'school.data_changed': 'Iskola adatai módosítva',
  'contact.updated': 'Kapcsolattartó neve módosítva',
};

export const reviewFlagLabels: Record<string, string> = {
  exact_image_hash: 'Ugyanez a fotó másik beküldésnél is szerepel',
  confirmed_identifier_collision: 'A bizonylat azonosítója már szerepel egy jóváhagyott gyűjtésnél',
  ocr_identifier_match: 'Lehetséges azonosítóegyezés',
  receipt_values_match: 'Másik beküldéssel egyező adatok',
  perceptual_image_similarity: 'Másik beküldéshez hasonló fotó',
  abnormal_velocity: 'Szokatlanul sok beküldés rövid idő alatt',
  other: 'További ellenőrzés szükséges',
};
