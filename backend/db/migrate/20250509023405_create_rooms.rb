class CreateRooms < ActiveRecord::Migration[7.2]
  def change
    create_table :rooms do |t|
      t.string :name, null: false # 部屋名 (必須)
      t.integer :capacity        # 収容人数 (オプション)
      t.timestamps               # created_at および updated_at カラムを自動生成

      # 必要に応じて他のカラムを追加
      # 例: t.text :description # 部屋の説明
    end
  end
end