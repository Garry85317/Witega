#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
批量更新所有产品页面的面包屑导航
"""

import os
import re
import json
from pathlib import Path

# 产品数据（从 products.js 提取）
PRODUCTS_DATA = {
    "K1": {"category": "tools", "categoryName": "省工機具"},
    "T1": {"category": "tools", "categoryName": "省工機具"},
    "R1": {"category": "tools", "categoryName": "省工機具"},
    "F1": {"category": "tools", "categoryName": "省工機具"},
    "EPIG": {"category": "tools", "categoryName": "省工機具"},
    "tooth": {"category": "tools", "categoryName": "省工機具"},
    "RX1": {"category": "smart-detection", "categoryName": "智能檢測儀器"},
    "RX-1": {"category": "smart-detection", "categoryName": "智能檢測儀器"},
    "RU1": {"category": "smart-detection", "categoryName": "智能檢測儀器"},
    "RU-1": {"category": "smart-detection", "categoryName": "智能檢測儀器"},
    "RL1": {"category": "smart-detection", "categoryName": "智能檢測儀器"},
    "RL-1": {"category": "smart-detection", "categoryName": "智能檢測儀器"},
    "G1": {"category": "smart-detection", "categoryName": "智能檢測儀器"},
    "iSperm": {"category": "smart-detection", "categoryName": "智能檢測儀器"},
    "ammoniaDetector": {"category": "smart-detection", "categoryName": "智能檢測儀器"},
    "anemometer": {"category": "smart-detection", "categoryName": "智能檢測儀器"},
    "animalThermometer": {"category": "smart-detection", "categoryName": "智能檢測儀器"},
    "digitalThermo": {"category": "smart-detection", "categoryName": "智能檢測儀器"},
    "infraRedThermometer": {"category": "smart-detection", "categoryName": "智能檢測儀器"},
    "lightTester": {"category": "smart-detection", "categoryName": "智能檢測儀器"},
    "maxMinThermometer": {"category": "smart-detection", "categoryName": "智能檢測儀器"},
    "octagonThermoHygro": {"category": "smart-detection", "categoryName": "智能檢測儀器"},
    "PHTestPaper": {"category": "smart-detection", "categoryName": "智能檢測儀器"},
    "remoteTemperatureDetector": {"category": "smart-detection", "categoryName": "智能檢測儀器"},
    "temperatureHumidityMonitor": {"category": "smart-detection", "categoryName": "智能檢測儀器"},
    "temperatureHumidityProbe": {"category": "smart-detection", "categoryName": "智能檢測儀器"},
    "tempRecorder": {"category": "smart-detection", "categoryName": "智能檢測儀器"},
    "thermoHygroMeter": {"category": "smart-detection", "categoryName": "智能檢測儀器"},
    "wash": {"category": "biosecurity", "categoryName": "生物安全防治設備"},
    "animalMarkingSpray": {"category": "animal-marking", "categoryName": "動物標示"},
    "automaticTagApplicator": {"category": "animal-marking", "categoryName": "動物標示"},
    "circleEarTag": {"category": "animal-marking", "categoryName": "動物標示"},
    "cutterForRemovingEarTag": {"category": "animal-marking", "categoryName": "動物標示"},
    "earCutter": {"category": "animal-marking", "categoryName": "動物標示"},
    "earNotcher": {"category": "animal-marking", "categoryName": "動物標示"},
    "earTagMarkerPen": {"category": "animal-marking", "categoryName": "動物標示"},
    "electricEarTagApplicator": {"category": "animal-marking", "categoryName": "動物標示"},
    "electronicEarTagReader": {"category": "animal-marking", "categoryName": "動物標示"},
    "markingCrayon": {"category": "animal-marking", "categoryName": "動物標示"},
    "sectorEarTag": {"category": "animal-marking", "categoryName": "動物標示"},
    "sheepEarTag": {"category": "animal-marking", "categoryName": "動物標示"},
    "squareEarTag": {"category": "animal-marking", "categoryName": "動物標示"},
    "animalScalpNeedle": {"category": "injection", "categoryName": "注射防疫"},
    "butterflyBloodNeedle": {"category": "injection", "categoryName": "注射防疫"},
    "disinfectionNeedleBox": {"category": "injection", "categoryName": "注射防疫"},
    "disposableBloodCollectionAndStorage": {"category": "injection", "categoryName": "注射防疫"},
    "disposableSyringe": {"category": "injection", "categoryName": "注射防疫"},
    "disposableTraceBloodCollectionVessel": {"category": "injection", "categoryName": "注射防疫"},
    "disposableVacuumBloodCollectionVessel": {"category": "injection", "categoryName": "注射防疫"},
    "needleHolders": {"category": "injection", "categoryName": "注射防疫"},
    "straightBloodNeedle": {"category": "injection", "categoryName": "注射防疫"},
    "staightBloodNeedle": {"category": "injection", "categoryName": "注射防疫"},
    "DHFuelHotFan": {"category": "temperature", "categoryName": "環溫控制"},
    "DHCFuelHotFan": {"category": "temperature", "categoryName": "環溫控制"},
    "electricHeatingFanElite": {"category": "temperature", "categoryName": "環溫控制"},
    "pigHeatBoard": {"category": "temperature", "categoryName": "環溫控制"},
    "roughInfraredHeatLamp": {"category": "temperature", "categoryName": "環溫控制"},
    "smoothInfraredHeatLamp": {"category": "temperature", "categoryName": "環溫控制"},
    "heatingLampHolder": {"category": "temperature", "categoryName": "環溫控制"},
    "atomizedFumigationAndDisinfectionSystem": {"category": "disinfection", "categoryName": "清洗消毒"},
    "bootCleaner": {"category": "disinfection", "categoryName": "清洗消毒"},
    "disinfectionWetWipes": {"category": "disinfection", "categoryName": "清洗消毒"},
    "disposableElasticBootCover": {"category": "disinfection", "categoryName": "清洗消毒"},
    "epidemicPreventionMistCannonTruck": {"category": "disinfection", "categoryName": "清洗消毒"},
    "flameDisinfectionGun": {"category": "disinfection", "categoryName": "清洗消毒"},
    "handPushDisinfectionMachine": {"category": "disinfection", "categoryName": "清洗消毒"},
    "intelligentAtomizingDisinfector": {"category": "disinfection", "categoryName": "清洗消毒"},
    "mistDisinfectionMachine": {"category": "disinfection", "categoryName": "清洗消毒"},
    "mobileOzoneGenerator": {"category": "disinfection", "categoryName": "清洗消毒"},
    "portableOzoneGenerator": {"category": "disinfection", "categoryName": "清洗消毒"},
    "smartVehicleDisinfectionTunnel": {"category": "disinfection", "categoryName": "清洗消毒"},
    "vehicleChassisCleaner": {"category": "disinfection", "categoryName": "清洗消毒"},
    "wallMountedOzoneGenerator": {"category": "disinfection", "categoryName": "清洗消毒"},
    "disinfectionBoot": {"category": "epidemicPrevention", "categoryName": "豬場防疫"},
    "disinfectionSafetyBoot": {"category": "epidemicPrevention", "categoryName": "豬場防疫"},
    "disposableCoverall": {"category": "epidemicPrevention", "categoryName": "豬場防疫"},
    "disposableElasticBootCover_ep": {"category": "epidemicPrevention", "categoryName": "豬場防疫"},
    "disposableLatexGloves": {"category": "epidemicPrevention", "categoryName": "豬場防疫"},
    "disposableLongGloves": {"category": "epidemicPrevention", "categoryName": "豬場防疫"},
    "disposableNitrileGloves": {"category": "epidemicPrevention", "categoryName": "豬場防疫"},
    "disposablePeGloves": {"category": "epidemicPrevention", "categoryName": "豬場防疫"},
    "disposablePvcGloves": {"category": "epidemicPrevention", "categoryName": "豬場防疫"},
    "disposableUnderwear": {"category": "epidemicPrevention", "categoryName": "豬場防疫"},
    "goggles": {"category": "epidemicPrevention", "categoryName": "豬場防疫"},
    # 養殖器械 equipment
    "hemostaticForcepsNeedleForceps": {"category": "equipment", "categoryName": "養殖器械"},
    "pigSoundSimulator": {"category": "equipment", "categoryName": "養殖器械"},
    "plugInTeethGrindingMachine": {"category": "equipment", "categoryName": "養殖器械"},
    "scalpelHandleAndBlade": {"category": "equipment", "categoryName": "養殖器械"},
    "semenCollectionBagWithFilter": {"category": "equipment", "categoryName": "養殖器械"},
    "semenCollectionCup": {"category": "equipment", "categoryName": "養殖器械"},
    "semenFilterGauze": {"category": "equipment", "categoryName": "養殖器械"},
    "sutureLineForAnimals": {"category": "equipment", "categoryName": "養殖器械"},
    "sutureNeedleForAnimals": {"category": "equipment", "categoryName": "養殖器械"},
    "tailDockingForceps": {"category": "equipment", "categoryName": "養殖器械"},
    "teethCuttingForceps": {"category": "equipment", "categoryName": "養殖器械"},
    "disposableSemenCollectionBag": {"category": "equipment", "categoryName": "養殖器械"},
    "electricThermostaticSemenCollectionCup": {"category": "equipment", "categoryName": "養殖器械"},
    "boarOdorant": {"category": "equipment", "categoryName": "養殖器械"},
    "breedingSaddlesInseminationBackbag": {"category": "equipment", "categoryName": "養殖器械"},
    "artificialInseminationTrolleyForPigs": {"category": "equipment", "categoryName": "養殖器械"},
    "animalVibrator": {"category": "equipment", "categoryName": "養殖器械"},
    "toolBoxMedicineBox": {"category": "equipment", "categoryName": "養殖器械"},
    "deliveryPapers": {"category": "equipment", "categoryName": "養殖器械"},
    "disposableUmbilicalCordClamps": {"category": "equipment", "categoryName": "養殖器械"},
    "pigletTailDockerModule": {"category": "equipment", "categoryName": "養殖器械"},
    "gasTailDocker": {"category": "equipment", "categoryName": "養殖器械"},
    "electricTailDocker": {"category": "equipment", "categoryName": "養殖器械"},
    "pigletCastrationSupports": {"category": "equipment", "categoryName": "養殖器械"},
    "miniCastrationScalpel": {"category": "equipment", "categoryName": "養殖器械"},
    "obstetricTools": {"category": "equipment", "categoryName": "養殖器械"},
    "medicalGauze": {"category": "equipment", "categoryName": "養殖器械"},
    "organizationForceps": {"category": "equipment", "categoryName": "養殖器械"},
    "medicalTray": {"category": "equipment", "categoryName": "養殖器械"},
    "surgicalScissors": {"category": "equipment", "categoryName": "養殖器械"},
    "plasticFeedScoop": {"category": "equipment", "categoryName": "養殖器械"},
    "stainlessSteelFeedScoop": {"category": "equipment", "categoryName": "養殖器械"},
    "aluminumFeedScoop": {"category": "equipment", "categoryName": "養殖器械"},
    "backfatCaliper": {"category": "equipment", "categoryName": "養殖器械"},
    "americanVersionOfTheBackCaliper": {"category": "equipment", "categoryName": "養殖器械"},
    "backupBodyRuler": {"category": "equipment", "categoryName": "養殖器械"},
    "pigletRubberMat": {"category": "equipment", "categoryName": "養殖器械"},
    "mouthOpenerForPig": {"category": "equipment", "categoryName": "養殖器械"},
    "electricPowderSprayer": {"category": "equipment", "categoryName": "養殖器械"},
    "smartFeeder": {"category": "equipment", "categoryName": "養殖器械"},
    "pigletWeighbridge": {"category": "equipment", "categoryName": "養殖器械"},
    "animalTrap": {"category": "equipment", "categoryName": "養殖器械"},
    "pigletVentilator": {"category": "equipment", "categoryName": "養殖器械"},
    "singleSowMeasuringScale": {"category": "equipment", "categoryName": "養殖器械"},
    "stainlessSteelPigletBowl": {"category": "equipment", "categoryName": "養殖器械"},
    "pigletFeedingTrough": {"category": "equipment", "categoryName": "養殖器械"},
    "biteNipple": {"category": "equipment", "categoryName": "養殖器械"},
    "troughAndBowlNipple": {"category": "equipment", "categoryName": "養殖器械"},
    "biteBallNipple": {"category": "equipment", "categoryName": "養殖器械"},
    "roundDrinkingBowl": {"category": "equipment", "categoryName": "養殖器械"},
    "ellipticDrinkingBowl": {"category": "equipment", "categoryName": "養殖器械"},
    "rectangularDrinkingTrough": {"category": "equipment", "categoryName": "養殖器械"},
    "halfRoundDrinkingTrough": {"category": "equipment", "categoryName": "養殖器械"},
    "eightTypeDrinkingTrough": {"category": "equipment", "categoryName": "養殖器械"},
    "longPigHolder": {"category": "equipment", "categoryName": "養殖器械"},
    "plasticPigHolder": {"category": "equipment", "categoryName": "養殖器械"},
    "galvanizedPigHolder": {"category": "equipment", "categoryName": "養殖器械"},
    "longSortingPaddle": {"category": "equipment", "categoryName": "養殖器械"},
    "shortSortingPaddle": {"category": "equipment", "categoryName": "養殖器械"},
    "pigProd": {"category": "equipment", "categoryName": "養殖器械"},
    "pigCatcher": {"category": "equipment", "categoryName": "養殖器械"},
    "ventilationPipe": {"category": "equipment", "categoryName": "養殖器械"},
    "afterbirthBag": {"category": "equipment", "categoryName": "養殖器械"},
    "carlboMedicineDoser": {"category": "equipment", "categoryName": "養殖器械"},
    "dosatronMedicineDoser": {"category": "equipment", "categoryName": "養殖器械"},
    "animalTrap": {"category": "equipment", "categoryName": "養殖器械"},
    "carcassBag": {"category": "equipment", "categoryName": "養殖器械"},
    # Nanolike (未出現在 products.js，歸入智能檢測儀器)
    "Nanolike": {"category": "smart-detection", "categoryName": "智能檢測儀器"},
}

# 从 products.js 读取完整数据
def load_products_data():
    """从 products.js 文件加载产品数据"""
    products_js_path = Path("assets/data/products.js")
    if not products_js_path.exists():
        return PRODUCTS_DATA
    
    try:
        with open(products_js_path, 'r', encoding='utf-8') as f:
            content = f.read()
            # 提取 JSON 部分
            json_match = re.search(r'const productsData = ({.*?});', content, re.DOTALL)
            if json_match:
                json_str = json_match.group(1)
                data = json.loads(json_str)
                
                # 构建产品ID到类别的映射
                product_map = {}
                for category in data.get('categories', []):
                    category_id = category.get('id', '')
                    category_name = category.get('name', '')
                    for product in category.get('products', []):
                        product_id = product.get('id', '')
                        product_map[product_id] = {
                            'category': category_id,
                            'categoryName': category_name
                        }
                return product_map
    except Exception as e:
        print(f"读取 products.js 失败: {e}")
    
    return PRODUCTS_DATA

def get_product_id_from_path(file_path):
    """从文件路径提取产品ID"""
    # 获取文件名（不含扩展名）
    filename = Path(file_path).stem
    
    # 处理特殊文件名映射
    filename_mapping = {
        'RX-1': 'RX1',
        'RU-1': 'RU1',
        'RL-1': 'RL1',
    }
    
    if filename in filename_mapping:
        return filename_mapping[filename]
    
    return filename

def get_breadcrumb_path(file_path):
    """根据文件路径确定面包屑的相对路径"""
    # 计算从产品文件到根目录的层级
    path_parts = Path(file_path).parts
    depth = len([p for p in path_parts if p != 'product'])
    
    # 如果是 product/xxx.html，使用 ../
    # 如果是 product/xxx/yyy.html，使用 ../../
    if depth == 2:  # product/xxx.html
        return '../'
    elif depth == 3:  # product/xxx/yyy.html
        return '../../'
    else:
        return '../'

def update_breadcrumb(file_path, product_id, category_id, category_name, product_name):
    """更新单个文件的面包屑"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # 确定相对路径
        breadcrumb_path = get_breadcrumb_path(file_path)
        
        # 构建新的面包屑 HTML
        new_breadcrumb = f'''            <ol>
              <li><a href="{breadcrumb_path}products.html">產品列表</a></li>
              <li><a href="{breadcrumb_path}products.html?category={category_id}">{category_name}</a></li>
              <li>{product_name}</li>
            </ol>'''
        
        # 匹配现有的面包屑部分
        # 匹配 <ol>...</ol> 部分
        pattern = r'<ol>.*?</ol>'
        match = re.search(pattern, content, re.DOTALL)
        
        if match:
            # 替换面包屑
            new_content = content[:match.start()] + new_breadcrumb + content[match.end():]
            
            # 写回文件
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(new_content)
            return True
        else:
            print(f"警告: 在 {file_path} 中未找到面包屑")
            return False
            
    except Exception as e:
        print(f"更新 {file_path} 失败: {e}")
        return False

def extract_product_name_from_file(file_path):
    """从 HTML 文件中提取产品名称"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # 尝试从面包屑中提取
        breadcrumb_match = re.search(r'<li>([^<]+)</li>\s*</ol>', content)
        if breadcrumb_match:
            return breadcrumb_match.group(1).strip()
        
        # 尝试从 title 中提取
        title_match = re.search(r'<title>([^<]+)', content)
        if title_match:
            title = title_match.group(1).strip()
            # 移除 " - Witega" 后缀
            if ' - Witega' in title:
                return title.replace(' - Witega', '').strip()
            return title
        
        # 尝试从 h3 中提取
        h3_match = re.search(r'<h3>([^<]+)</h3>', content)
        if h3_match:
            return h3_match.group(1).strip()
        
        return None
    except:
        return None

def main():
    """主函数"""
    # 加载产品数据
    products_data = load_products_data()
    
    # 查找所有产品 HTML 文件
    product_dir = Path('product')
    html_files = list(product_dir.rglob('*.html'))
    
    updated_count = 0
    failed_count = 0
    
    for html_file in html_files:
        # 跳过目录索引文件
        if html_file.name == 'index.html':
            continue
        
        # 获取产品ID
        product_id = get_product_id_from_path(html_file)
        
        # 查找产品数据
        product_info = products_data.get(product_id)
        
        if not product_info:
            # 尝试使用文件名作为产品ID
            product_info = products_data.get(html_file.stem)
        
        if not product_info:
            print(f"警告: 未找到产品 {product_id} ({html_file}) 的类别信息")
            failed_count += 1
            continue
        
        # 提取产品名称
        product_name = extract_product_name_from_file(html_file)
        if not product_name:
            print(f"警告: 无法从 {html_file} 提取产品名称")
            failed_count += 1
            continue
        
        # 更新面包屑
        if update_breadcrumb(
            html_file,
            product_id,
            product_info['category'],
            product_info['categoryName'],
            product_name
        ):
            updated_count += 1
            print(f"✓ 已更新: {html_file}")
        else:
            failed_count += 1
    
    print(f"\n完成! 成功更新: {updated_count}, 失败: {failed_count}")

if __name__ == '__main__':
    main()

