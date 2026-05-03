"""Enrollment Quality Audit Script
Checks all known_faces for quality issues that hurt recognition accuracy.
"""

import os
import cv2
import numpy as np

def audit_enrollment(known_faces_path="known_faces"):
    """Audit all enrolled face images for quality issues"""
    
    if not os.path.exists(known_faces_path):
        print(f"ERROR: {known_faces_path} not found")
        return
    
    total_people = 0
    total_images = 0
    people_with_issues = 0
    
    print("=" * 60)
    print("ENROLLMENT QUALITY AUDIT")
    print("=" * 60)
    print()
    
    for person in sorted(os.listdir(known_faces_path)):
        person_dir = os.path.join(known_faces_path, person)
        if not os.path.isdir(person_dir):
            continue
        
        total_people += 1
        images = [f for f in os.listdir(person_dir) 
                  if f.lower().endswith(('.jpg', '.jpeg', '.png'))]
        
        issues = []
        
        # Check image count
        if len(images) < 3:
            issues.append(f"CRITICAL: Only {len(images)} image(s) (need >=5 for reliable recognition)")
        elif len(images) < 5:
            issues.append(f"WARNING: Only {len(images)} images (recommend >=5)")
        
        for img_file in images:
            img_path = os.path.join(person_dir, img_file)
            img = cv2.imread(img_path)
            if img is None:
                issues.append(f"  {img_file}: UNREADABLE")
                continue
            
            total_images += 1
            h, w = img.shape[:2]
            
            # Check image size
            if min(h, w) < 80:
                issues.append(f"  {img_file}: TOO SMALL ({w}x{h}px, need >=112x112)")
            
            # Check blur
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            blur_score = cv2.Laplacian(gray, cv2.CV_64F).var()
            if blur_score < 30:
                issues.append(f"  {img_file}: VERY BLURRY (score={blur_score:.0f}, need >=50)")
            elif blur_score < 50:
                issues.append(f"  {img_file}: SLIGHTLY BLURRY (score={blur_score:.0f})")
            
            # Check brightness
            brightness = np.mean(gray)
            if brightness < 40:
                issues.append(f"  {img_file}: TOO DARK (brightness={brightness:.0f})")
            elif brightness > 220:
                issues.append(f"  {img_file}: OVEREXPOSED (brightness={brightness:.0f})")
        
        if issues:
            people_with_issues += 1
            print(f"[!] {person} ({len(images)} images)")
            for issue in issues:
                print(f"    - {issue}")
        else:
            print(f"[OK] {person} ({len(images)} images)")
    
    print()
    print("=" * 60)
    print(f"SUMMARY: {total_people} people, {total_images} images")
    print(f"  [OK] {total_people - people_with_issues} people OK")
    print(f"  [!]  {people_with_issues} people with issues")
    print("=" * 60)
    
    if people_with_issues > 0:
        print()
        print("RECOMMENDATIONS:")
        print("  1. Add more photos (5+ per person) with different angles")
        print("  2. Re-take blurry photos with better focus")
        print("  3. Ensure face is well-lit and at least 112x112 pixels")
        print("  4. Include: front, left 45deg, right 45deg angles")

if __name__ == "__main__":
    audit_enrollment()
